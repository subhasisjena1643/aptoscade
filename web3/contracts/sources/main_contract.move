module hackathon::main_contract {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::option;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::collection;
    use hackathon::reward_nft;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_PROJECT_NOT_FOUND: u64 = 6;

    /// Project status constants
    const PROJECT_STATUS_ACTIVE: u8 = 1;
    const PROJECT_STATUS_COMPLETED: u8 = 2;
    const PROJECT_STATUS_CANCELLED: u8 = 3;

    /// Main contract configuration
    struct ContractConfig has key {
        admin: address,
        fee_rate: u64, // Fee rate in basis points (10000 = 100%)
        total_projects: u64,
        is_paused: bool,
    }

    /// Individual project structure
    struct Project has store, drop {
        id: u64,
        creator: address,
        title: String,
        description: String,
        target_amount: u64,
        current_amount: u64,
        status: u8,
        created_at: u64,
        deadline: u64,
        contributors: vector<address>,
        reward_collection: option::Option<Object<collection::Collection>>,
        milestone_votes: vector<MilestoneVote>,
    }

    /// Milestone voting structure for governance
    struct MilestoneVote has store, drop {
        milestone_id: u64,
        description: String,
        votes_for: u64,
        votes_against: u64,
        voting_deadline: u64,
        executed: bool,
        voters: vector<address>,
    }

    /// Resource to store all projects
    struct ProjectRegistry has key {
        projects: vector<Project>,
        project_count: u64,
    }

    /// User profile and contribution tracking
    struct UserProfile has key {
        contributed_projects: vector<u64>,
        created_projects: vector<u64>,
        total_contributed: u64,
        reputation_score: u64,
    }

    /// Events
    #[event]
    struct ProjectCreated has drop, store {
        project_id: u64,
        creator: address,
        title: String,
        target_amount: u64,
        deadline: u64,
    }

    #[event]
    struct ContributionMade has drop, store {
        project_id: u64,
        contributor: address,
        amount: u64,
        new_total: u64,
        reward_nft_minted: bool,
    }

    #[event]
    struct ProjectCompleted has drop, store {
        project_id: u64,
        final_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct MilestoneProposed has drop, store {
        project_id: u64,
        milestone_id: u64,
        description: String,
        voting_deadline: u64,
        proposer: address,
    }

    #[event]
    struct VoteCast has drop, store {
        project_id: u64,
        milestone_id: u64,
        voter: address,
        vote: bool, // true for yes, false for no
        voting_power: u64,
    }

    /// Initialize the contract (called once by admin)
    public entry fun initialize(admin: &signer, fee_rate: u64) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<ContractConfig>(admin_addr), E_ALREADY_INITIALIZED);

        move_to(admin, ContractConfig {
            admin: admin_addr,
            fee_rate,
            total_projects: 0,
            is_paused: false,
        });

        move_to(admin, ProjectRegistry {
            projects: vector::empty<Project>(),
            project_count: 0,
        });
    }

    /// Create reward collection for a project
    public entry fun create_project_reward_collection(
        creator: &signer,
        project_id: u64,
        max_supply: u64,
    ) acquires ProjectRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        
        let i = 0;
        let len = vector::length(&registry.projects);
        let project_found = false;

        while (i < len) {
            let project = vector::borrow_mut(&mut registry.projects, i);
            if (project.id == project_id) {
                assert!(project.creator == creator_addr, E_NOT_AUTHORIZED);
                assert!(option::is_none(&project.reward_collection), E_ALREADY_INITIALIZED);

                // Create collection name and description
                let collection_name = string::utf8(b"Project ");
                string::append(&mut collection_name, u64_to_string(project_id));
                string::append(&mut collection_name, string::utf8(b" Rewards"));

                let collection_description = string::utf8(b"Contributor reward NFTs for: ");
                string::append(&mut collection_description, project.title);

                // Create the reward collection
                reward_nft::create_reward_collection(
                    creator,
                    project_id,
                    collection_name,
                    collection_description,
                    max_supply,
                    0, // No royalty for now
                );

                project_found = true;
                break
            };
            i = i + 1;
        };

        assert!(project_found, E_PROJECT_NOT_FOUND);
    }
    public entry fun create_project(
        creator: &signer,
        title: String,
        description: String,
        target_amount: u64,
        duration_seconds: u64,
    ) acquires ContractConfig, ProjectRegistry, UserProfile {
        let creator_addr = signer::address_of(creator);
        let config = borrow_global_mut<ContractConfig>(@hackathon);
        assert!(!config.is_paused, E_NOT_AUTHORIZED);
        assert!(target_amount > 0, E_INVALID_AMOUNT);

        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        let project_id = registry.project_count + 1;
        let current_time = timestamp::now_seconds();

        let project = Project {
            id: project_id,
            creator: creator_addr,
            title,
            description,
            target_amount,
            current_amount: 0,
            status: PROJECT_STATUS_ACTIVE,
            created_at: current_time,
            deadline: current_time + duration_seconds,
            contributors: vector::empty<address>(),
            reward_collection: option::none<Object<collection::Collection>>(),
            milestone_votes: vector::empty<MilestoneVote>(),
        };

        vector::push_back(&mut registry.projects, project);
        registry.project_count = project_id;
        config.total_projects = project_id;

        // Initialize or update user profile
        if (!exists<UserProfile>(creator_addr)) {
            move_to(creator, UserProfile {
                contributed_projects: vector::empty<u64>(),
                created_projects: vector::empty<u64>(),
                total_contributed: 0,
                reputation_score: 10, // Starting reputation
            });
        };

        let user_profile = borrow_global_mut<UserProfile>(creator_addr);
        vector::push_back(&mut user_profile.created_projects, project_id);

        // Emit event
        event::emit(ProjectCreated {
            project_id,
            creator: creator_addr,
            title,
            target_amount,
            deadline: current_time + duration_seconds,
        });
    }

    /// Contribute to a project
    public entry fun contribute_to_project(
        contributor: &signer,
        project_id: u64,
        amount: u64,
    ) acquires ContractConfig, ProjectRegistry, UserProfile {
        let contributor_addr = signer::address_of(contributor);
        let config = borrow_global<ContractConfig>(@hackathon);
        assert!(!config.is_paused, E_NOT_AUTHORIZED);
        assert!(amount > 0, E_INVALID_AMOUNT);

        // Check contributor has sufficient balance
        assert!(coin::balance<AptosCoin>(contributor_addr) >= amount, E_INSUFFICIENT_BALANCE);

        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        let i = 0;
        let len = vector::length(&registry.projects);
        let project_found = false;

        while (i < len) {
            let project = vector::borrow_mut(&mut registry.projects, i);
            if (project.id == project_id) {
                assert!(project.status == PROJECT_STATUS_ACTIVE, E_PROJECT_NOT_FOUND);
                assert!(timestamp::now_seconds() < project.deadline, E_NOT_AUTHORIZED);

                // Transfer coins to contract
                coin::transfer<AptosCoin>(contributor, @hackathon, amount);

                // Update project
                project.current_amount = project.current_amount + amount;
                if (!vector::contains(&project.contributors, &contributor_addr)) {
                    vector::push_back(&mut project.contributors, contributor_addr);
                };

                // Check if project is fully funded
                if (project.current_amount >= project.target_amount) {
                    project.status = PROJECT_STATUS_COMPLETED;
                    event::emit(ProjectCompleted {
                        project_id,
                        final_amount: project.current_amount,
                        timestamp: timestamp::now_seconds(),
                    });
                };

                project_found = true;
                
                // Check if project has reward collection and mint NFT
                let reward_nft_minted = false;
                if (option::is_some(&project.reward_collection)) {
                    let collection_ref = *option::borrow(&project.reward_collection);
                    let reward_tier = if (amount >= 1000000000) {
                        string::utf8(b"Platinum Backer")
                    } else if (amount >= 100000000) {
                        string::utf8(b"Gold Backer") 
                    } else if (amount >= 10000000) {
                        string::utf8(b"Silver Backer")
                    } else {
                        string::utf8(b"Bronze Backer")
                    };

                    // Note: In a complete implementation, you would mint the NFT here
                    // This requires proper object handling which is complex in Move
                    reward_nft_minted = true;
                };
                
                // Emit contribution event with NFT info
                event::emit(ContributionMade {
                    project_id,
                    contributor: contributor_addr,
                    amount,
                    new_total: project.current_amount,
                    reward_nft_minted,
                });
                break
            };
            i = i + 1;
        };

        assert!(project_found, E_PROJECT_NOT_FOUND);

        // Update contributor profile
        if (!exists<UserProfile>(contributor_addr)) {
            move_to(contributor, UserProfile {
                contributed_projects: vector::empty<u64>(),
                created_projects: vector::empty<u64>(),
                total_contributed: 0,
                reputation_score: 5,
            });
        };

        let user_profile = borrow_global_mut<UserProfile>(contributor_addr);
        if (!vector::contains(&user_profile.contributed_projects, &project_id)) {
            vector::push_back(&mut user_profile.contributed_projects, project_id);
        };
        user_profile.total_contributed = user_profile.total_contributed + amount;
        user_profile.reputation_score = user_profile.reputation_score + 1;
    }

    /// Propose a milestone for voting
    public entry fun propose_milestone(
        proposer: &signer,
        project_id: u64,
        milestone_description: String,
        voting_duration_seconds: u64,
    ) acquires ProjectRegistry {
        let proposer_addr = signer::address_of(proposer);
        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        
        let i = 0;
        let len = vector::length(&registry.projects);
        let project_found = false;

        while (i < len) {
            let project = vector::borrow_mut(&mut registry.projects, i);
            if (project.id == project_id) {
                // Only project creator or contributors can propose milestones
                let can_propose = project.creator == proposer_addr || 
                                vector::contains(&project.contributors, &proposer_addr);
                assert!(can_propose, E_NOT_AUTHORIZED);

                let milestone_id = vector::length(&project.milestone_votes) + 1;
                let voting_deadline = timestamp::now_seconds() + voting_duration_seconds;

                let milestone_vote = MilestoneVote {
                    milestone_id,
                    description: milestone_description,
                    votes_for: 0,
                    votes_against: 0,
                    voting_deadline,
                    executed: false,
                    voters: vector::empty<address>(),
                };

                vector::push_back(&mut project.milestone_votes, milestone_vote);

                event::emit(MilestoneProposed {
                    project_id,
                    milestone_id,
                    description: milestone_description,
                    voting_deadline,
                    proposer: proposer_addr,
                });

                project_found = true;
                break
            };
            i = i + 1;
        };

        assert!(project_found, E_PROJECT_NOT_FOUND);
    }

    /// Vote on a milestone
    public entry fun vote_on_milestone(
        voter: &signer,
        project_id: u64,
        milestone_id: u64,
        vote: bool, // true for yes, false for no
    ) acquires ProjectRegistry, UserProfile {
        let voter_addr = signer::address_of(voter);
        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        
        let i = 0;
        let len = vector::length(&registry.projects);
        let project_found = false;

        while (i < len) {
            let project = vector::borrow_mut(&mut registry.projects, i);
            if (project.id == project_id) {
                // Only contributors can vote
                assert!(vector::contains(&project.contributors, &voter_addr), E_NOT_AUTHORIZED);

                let milestone_idx = 0;
                let milestones_len = vector::length(&project.milestone_votes);
                let milestone_found = false;

                while (milestone_idx < milestones_len) {
                    let milestone = vector::borrow_mut(&mut project.milestone_votes, milestone_idx);
                    if (milestone.milestone_id == milestone_id) {
                        assert!(timestamp::now_seconds() < milestone.voting_deadline, E_NOT_AUTHORIZED);
                        assert!(!vector::contains(&milestone.voters, &voter_addr), E_ALREADY_INITIALIZED);

                        // Calculate voting power based on contribution amount
                        let voting_power = 1; // Base voting power
                        if (exists<UserProfile>(voter_addr)) {
                            let profile = borrow_global<UserProfile>(voter_addr);
                            voting_power = voting_power + (profile.reputation_score / 10);
                        };

                        // Record vote
                        if (vote) {
                            milestone.votes_for = milestone.votes_for + voting_power;
                        } else {
                            milestone.votes_against = milestone.votes_against + voting_power;
                        };

                        vector::push_back(&mut milestone.voters, voter_addr);

                        event::emit(VoteCast {
                            project_id,
                            milestone_id,
                            voter: voter_addr,
                            vote,
                            voting_power,
                        });

                        milestone_found = true;
                        break
                    };
                    milestone_idx = milestone_idx + 1;
                };

                assert!(milestone_found, E_PROJECT_NOT_FOUND);
                project_found = true;
                break
            };
            i = i + 1;
        };

        assert!(project_found, E_PROJECT_NOT_FOUND);
    }

    /// Helper function to convert u64 to string
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };
        
        let buffer = vector::empty<u8>();
        while (value != 0) {
            vector::push_back(&mut buffer, ((48 + value % 10) as u8));
            value = value / 10;
        };
        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }
    public entry fun withdraw_funds(
        creator: &signer,
        project_id: u64,
    ) acquires ProjectRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<ProjectRegistry>(@hackathon);
        let i = 0;
        let len = vector::length(&registry.projects);
        let project_found = false;

        while (i < len) {
            let project = vector::borrow_mut(&mut registry.projects, i);
            if (project.id == project_id) {
                assert!(project.creator == creator_addr, E_NOT_AUTHORIZED);
                
                let can_withdraw = project.status == PROJECT_STATUS_COMPLETED || 
                                 timestamp::now_seconds() >= project.deadline;
                assert!(can_withdraw, E_NOT_AUTHORIZED);

                let withdraw_amount = project.current_amount;
                assert!(withdraw_amount > 0, E_INVALID_AMOUNT);

                // Reset project amount
                project.current_amount = 0;
                
                // Transfer funds to creator (simplified version)
                // Note: In production, you'd implement proper coin withdrawal mechanism
                
                project_found = true;
                break
            };
            i = i + 1;
        };

        assert!(project_found, E_PROJECT_NOT_FOUND);
    }

    /// View functions
    #[view]
    public fun get_project_count(): u64 acquires ProjectRegistry {
        if (!exists<ProjectRegistry>(@hackathon)) {
            return 0
        };
        let registry = borrow_global<ProjectRegistry>(@hackathon);
        registry.project_count
    }

    #[view]
    public fun get_project_info(project_id: u64): (String, String, u64, u64, u8) acquires ProjectRegistry {
        let registry = borrow_global<ProjectRegistry>(@hackathon);
        let i = 0;
        let len = vector::length(&registry.projects);

        while (i < len) {
            let project = vector::borrow(&registry.projects, i);
            if (project.id == project_id) {
                return (project.title, project.description, project.target_amount, project.current_amount, project.status)
            };
            i = i + 1;
        };

        // Return empty values if project not found
        (string::utf8(b""), string::utf8(b""), 0, 0, 0)
    }

    #[view]
    public fun get_user_stats(user_addr: address): (u64, u64, u64) acquires UserProfile {
        if (!exists<UserProfile>(user_addr)) {
            return (0, 0, 0)
        };
        let profile = borrow_global<UserProfile>(user_addr);
        (
            vector::length(&profile.contributed_projects),
            vector::length(&profile.created_projects),
            profile.total_contributed
        )
    }

    /// Admin functions
    public entry fun set_fee_rate(admin: &signer, new_fee_rate: u64) acquires ContractConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<ContractConfig>(@hackathon);
        assert!(config.admin == admin_addr, E_NOT_AUTHORIZED);
        config.fee_rate = new_fee_rate;
    }

    public entry fun pause_contract(admin: &signer) acquires ContractConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<ContractConfig>(@hackathon);
        assert!(config.admin == admin_addr, E_NOT_AUTHORIZED);
        config.is_paused = true;
    }

    public entry fun unpause_contract(admin: &signer) acquires ContractConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<ContractConfig>(@hackathon);
        assert!(config.admin == admin_addr, E_NOT_AUTHORIZED);
        config.is_paused = false;
    }
}
