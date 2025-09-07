module hackathon::reward_nft {
    use std::signer;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_token_objects::collection;
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::property_map;
    use aptos_framework::object::{Self, Object, ExtendRef};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_COLLECTION_NOT_FOUND: u64 = 2;
    const E_TOKEN_ALREADY_MINTED: u64 = 3;
    const E_INSUFFICIENT_CONTRIBUTION: u64 = 4;

    /// Collection configuration for project rewards
    struct ProjectRewardCollection has key {
        extend_ref: ExtendRef,
        project_id: u64,
        project_creator: address,
        total_minted: u64,
        max_supply: u64,
    }

    /// NFT metadata for contribution rewards
    struct ContributorReward has key {
        project_id: u64,
        contributor: address,
        contribution_amount: u64,
        reward_tier: String,
        minted_at: u64,
        unique_id: u64,
    }

    /// Events
    #[event]
    struct RewardCollectionCreated has drop, store {
        project_id: u64,
        creator: address,
        collection_name: String,
        max_supply: u64,
    }

    #[event]
    struct RewardNFTMinted has drop, store {
        project_id: u64,
        recipient: address,
        token_name: String,
        contribution_amount: u64,
        reward_tier: String,
    }

    /// Create a reward collection for a project
    public fun create_reward_collection(
        creator: &signer,
        project_id: u64,
        collection_name: String,
        collection_description: String,
        max_supply: u64,
        royalty_percentage: u64,
    ) {
        let creator_addr = signer::address_of(creator);
        
        // Create the collection
        let constructor_ref = collection::create_unlimited_collection(
            creator,
            collection_description,
            collection_name,
            option::none(), // No royalty for now
            string::utf8(b"https://hackathon-project.com/"), // Base URI
        );

        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let collection_signer = object::generate_signer(&constructor_ref);

        move_to(&collection_signer, ProjectRewardCollection {
            extend_ref,
            project_id,
            project_creator: creator_addr,
            total_minted: 0,
            max_supply,
        });

        event::emit(RewardCollectionCreated {
            project_id,
            creator: creator_addr,
            collection_name,
            max_supply,
        });
    }

    /// Mint reward NFT for a contributor
    public fun mint_contributor_reward(
        creator: &signer,
        collection_object: Object<collection::Collection>,
        project_id: u64,
        contributor: address,
        contribution_amount: u64,
        reward_tier: String,
    ): Object<Token> {
        let creator_addr = signer::address_of(creator);
        
        // Get collection details
        let collection_addr = object::object_address(&collection_object);
        let collection_config = borrow_global_mut<ProjectRewardCollection>(collection_addr);
        
        assert!(collection_config.project_creator == creator_addr, E_NOT_AUTHORIZED);
        assert!(collection_config.total_minted < collection_config.max_supply, E_TOKEN_ALREADY_MINTED);

        // Determine reward tier based on contribution
        let tier = if (contribution_amount >= 1000000000) { // 10 APT
            string::utf8(b"Platinum Backer")
        } else if (contribution_amount >= 100000000) { // 1 APT
            string::utf8(b"Gold Backer")
        } else if (contribution_amount >= 10000000) { // 0.1 APT
            string::utf8(b"Silver Backer")
        } else {
            string::utf8(b"Bronze Backer")
        };

        // Create unique token name
        let unique_id = collection_config.total_minted + 1;
        let token_name = string::utf8(b"Project ");
        string::append(&mut token_name, string::utf8(b"#"));
        string::append(&mut token_name, u64_to_string(project_id));
        string::append(&mut token_name, string::utf8(b" - "));
        string::append(&mut token_name, tier);
        string::append(&mut token_name, string::utf8(b" #"));
        string::append(&mut token_name, u64_to_string(unique_id));

        // Token description
        let description = string::utf8(b"Contribution reward NFT for supporting Project #");
        string::append(&mut description, u64_to_string(project_id));
        string::append(&mut description, string::utf8(b". Contribution: "));
        string::append(&mut description, u64_to_string(contribution_amount));
        string::append(&mut description, string::utf8(b" APT"));

        // Create token URI
        let token_uri = string::utf8(b"https://hackathon-project.com/nft/");
        string::append(&mut token_uri, u64_to_string(project_id));
        string::append(&mut token_uri, string::utf8(b"/"));
        string::append(&mut token_uri, u64_to_string(unique_id));

        // Create properties for the NFT
        let properties = property_map::prepare_input(
            vector[
                string::utf8(b"Project ID"),
                string::utf8(b"Contribution Amount"),
                string::utf8(b"Reward Tier"),
                string::utf8(b"Minted At"),
            ],
            vector[
                string::utf8(b"u64"),
                string::utf8(b"u64"),
                string::utf8(b"string"),
                string::utf8(b"u64"),
            ],
            vector[
                project_id_to_bytes(project_id),
                u64_to_bytes(contribution_amount),
                *string::bytes(&tier),
                u64_to_bytes(timestamp::now_seconds()),
            ]
        );

        // Mint the token
        let collection_signer = object::generate_signer_for_extending(&collection_config.extend_ref);
        let token_constructor_ref = token::create_from_account(
            &collection_signer,
            collection::name(collection_object),
            description,
            token_name,
            option::some(properties),
            token_uri,
        );

        let token_signer = object::generate_signer(&token_constructor_ref);
        let token_object = object::object_from_constructor_ref<Token>(&token_constructor_ref);

        // Store reward metadata
        move_to(&token_signer, ContributorReward {
            project_id,
            contributor,
            contribution_amount,
            reward_tier: tier,
            minted_at: timestamp::now_seconds(),
            unique_id,
        });

        // Update collection stats
        collection_config.total_minted = collection_config.total_minted + 1;

        // Transfer to contributor
        object::transfer(&collection_signer, token_object, contributor);

        event::emit(RewardNFTMinted {
            project_id,
            recipient: contributor,
            token_name,
            contribution_amount,
            reward_tier: tier,
        });

        token_object
    }

    /// Helper function to get reward info
    #[view]
    public fun get_reward_info(token_object: Object<Token>): (u64, address, u64, String, u64) {
        let token_addr = object::object_address(&token_object);
        if (!exists<ContributorReward>(token_addr)) {
            return (0, @0x0, 0, string::utf8(b""), 0)
        };
        
        let reward = borrow_global<ContributorReward>(token_addr);
        (
            reward.project_id,
            reward.contributor,
            reward.contribution_amount,
            reward.reward_tier,
            reward.minted_at
        )
    }

    /// Helper function to get collection stats
    #[view]
    public fun get_collection_stats(collection_object: Object<collection::Collection>): (u64, u64, u64) {
        let collection_addr = object::object_address(&collection_object);
        if (!exists<ProjectRewardCollection>(collection_addr)) {
            return (0, 0, 0)
        };
        
        let config = borrow_global<ProjectRewardCollection>(collection_addr);
        (config.project_id, config.total_minted, config.max_supply)
    }

    // Helper functions
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

    fun u64_to_bytes(value: u64): vector<u8> {
        let result = vector::empty<u8>();
        let i = 0;
        while (i < 8) {
            vector::push_back(&mut result, ((value >> (i * 8)) & 0xFF as u8));
            i = i + 1;
        };
        result
    }

    fun project_id_to_bytes(project_id: u64): vector<u8> {
        u64_to_bytes(project_id)
    }
}
