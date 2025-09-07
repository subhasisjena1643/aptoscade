module hackathon::main_contract {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;

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
    }

    #[event]
    struct ProjectCompleted has drop, store {
        project_id: u64,
        final_amount: u64,
        timestamp: u64,
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

    /// Create a new project
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
                
                // Emit contribution event
                event::emit(ContributionMade {
                    project_id,
                    contributor: contributor_addr,
                    amount,
                    new_total: project.current_amount,
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

    /// Withdraw funds (only project creator after completion or deadline)
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
