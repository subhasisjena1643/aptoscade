# 🌐 **WEB3 TEAM REQUIREMENTS DOCUMENT**

## 📋 **PROJECT OVERVIEW**

**Project**: AptosCade - Gaming Platform with Web3 Crowdfunding Integration  
**Backend Status**: 95% Complete - Ready for Web3 Integration  
**Your Role**: Smart Contract Development & Blockchain Integration  
**Timeline**: 7-14 days (depending on complexity)

---

## 🎯 **SMART CONTRACT ARCHITECTURE REQUIREMENTS**

### **Core Smart Contract Module Structure**

```move
module aptoscade::crowdfunding {
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_token::token;

    // Core data structures that MUST be implemented
    struct Project has key, store {
        id: String,
        creator: address,
        title: String,
        description: String,
        target_amount: u64,
        current_amount: u64,
        deadline: u64,
        status: u8, // 0=Active, 1=Funded, 2=Cancelled
        nft_collection_address: String,
        contributors: vector<address>,
    }

    struct Contribution has key, store {
        project_id: String,
        contributor: address,
        amount: u64,
        timestamp: u64,
        nft_tier: u8, // 0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
        auto_stake: bool,
    }

    struct StakingPosition has key, store {
        staker: address,
        amount: u64,
        tier: u8, // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
        lock_period_days: u64,
        staked_at: u64,
        unlocks_at: u64,
        rewards_earned: u64,
        is_active: bool,
    }

    struct GovernanceProposal has key, store {
        project_id: String,
        proposer: address,
        title: String,
        description: String,
        requested_amount: u64,
        votes_for: u64,
        votes_against: u64,
        voting_ends_at: u64,
        status: u8, // 0=Proposed, 1=Voting, 2=Approved, 3=Rejected
    }
}
```

---

## 🔧 **REQUIRED SMART CONTRACT FUNCTIONS**

### **1. PROJECT MANAGEMENT FUNCTIONS**

#### **Create Project Function**
```move
public entry fun create_project(
    creator: &signer,
    title: String,
    description: String,
    target_amount: u64,
    duration_days: u64,
    enable_nft_rewards: bool,
    enable_staking: bool
) acquires ProjectStore {
    // Implementation requirements:
    // 1. Validate creator account
    // 2. Generate unique project ID
    // 3. Set deadline = current_timestamp + (duration_days * 86400)
    // 4. Initialize project with status = 0 (Active)
    // 5. If enable_nft_rewards = true, create NFT collection
    // 6. Emit ProjectCreated event
    // 7. Return project ID and transaction hash
}
```

**Expected Response Format:**
```typescript
{
  success: true,
  projectHash: "project_abc123",
  transactionHash: "0xdef456...",
  blockchainId: "bc_project_789",
  nftCollectionAddress: "0x123abc..." // if NFT rewards enabled
}
```

#### **Contribute to Project Function**
```move
public entry fun contribute_to_project(
    contributor: &signer,
    project_id: String,
    amount: u64,
    auto_stake: bool
) acquires ProjectStore, ContributionStore {
    // Implementation requirements:
    // 1. Validate project exists and is active
    // 2. Validate contribution amount > 0
    // 3. Transfer APT from contributor to project escrow
    // 4. Update project current_amount
    // 5. Determine NFT tier based on contribution amount
    // 6. Mint NFT if tier > 0
    // 7. If auto_stake = true, create staking position with 10% of contribution
    // 8. Add contributor to project contributors list
    // 9. Emit ContributionMade event
    // 10. Check if project reached target (mark as funded)
}
```

**Expected Response Format:**
```typescript
{
  success: true,
  transactionHash: "0x789def...",
  nftReward: {
    tokenAddress: "0xabc123...",
    tier: "GOLD", // BRONZE, SILVER, GOLD, PLATINUM
    mintTransactionHash: "0x456ghi..."
  },
  stakingRecord: { // if auto_stake = true
    stakeTransactionHash: "0x789jkl...",
    amount: 100, // 10% of contribution
    tier: "SILVER"
  }
}
```

---

### **2. NFT REWARD SYSTEM**

#### **NFT Tier Calculation Logic**
```move
public fun calculate_nft_tier(contribution_amount: u64): u8 {
    if (contribution_amount >= 500000000) { // 5000 APT (Octas)
        4 // PLATINUM
    } else if (contribution_amount >= 100000000) { // 1000 APT
        3 // GOLD
    } else if (contribution_amount >= 50000000) { // 500 APT
        2 // SILVER
    } else if (contribution_amount >= 10000000) { // 100 APT
        1 // BRONZE
    } else {
        0 // No NFT
    }
}
```

#### **NFT Minting Function**
```move
public entry fun mint_contributor_nft(
    recipient: address,
    project_id: String,
    tier: u8,
    contribution_amount: u64
) acquires ProjectStore {
    // Implementation requirements:
    // 1. Validate tier > 0
    // 2. Generate unique token ID
    // 3. Create NFT metadata with attributes
    // 4. Mint NFT to recipient address
    // 5. Store NFT record in contributor rewards
    // 6. Emit NFTMinted event
}
```

**NFT Metadata Requirements:**
```json
{
  "name": "AptosCade Contributor #123",
  "description": "Exclusive contributor reward NFT for supporting innovative projects",
  "image": "https://metadata.aptoscade.com/nft/{tokenId}.png",
  "attributes": [
    {"trait_type": "Tier", "value": "GOLD"},
    {"trait_type": "Project", "value": "{project_title}"},
    {"trait_type": "Contribution Amount", "value": "{amount} APT"},
    {"trait_type": "Mint Date", "value": "{timestamp}"},
    {"trait_type": "Contributor Level", "value": "Early Supporter"}
  ],
  "external_url": "https://aptoscade.com/nft/{tokenId}"
}
```

---

### **3. STAKING SYSTEM**

#### **Stake Tokens Function**
```move
public entry fun stake_tokens(
    staker: &signer,
    amount: u64,
    lock_period_days: u64
) acquires StakingStore {
    // Implementation requirements:
    // 1. Validate amount > minimum stake (e.g., 10 APT)
    // 2. Validate lock_period_days is valid (30, 90, 180, 365)
    // 3. Determine staking tier based on lock period
    // 4. Transfer APT from staker to staking contract
    // 5. Calculate unlock timestamp
    // 6. Calculate governance power multiplier
    // 7. Create staking position record
    // 8. Emit TokensStaked event
}
```

**Staking Tier Logic:**
```move
public fun calculate_staking_tier(lock_period_days: u64): u8 {
    if (lock_period_days >= 365) {
        4 // PLATINUM - 15% APR, 3.0x governance power
    } else if (lock_period_days >= 180) {
        3 // GOLD - 12% APR, 2.0x governance power
    } else if (lock_period_days >= 90) {
        2 // SILVER - 10% APR, 1.5x governance power
    } else {
        1 // BRONZE - 8% APR, 1.0x governance power
    }
}
```

**Expected Response Format:**
```typescript
{
  success: true,
  stakeTransactionHash: "0xabc123...",
  tier: "GOLD",
  lockPeriodDays: 180,
  unlocksAt: "2025-03-06T10:30:00Z",
  governancePowerGained: 2000 // amount * multiplier
}
```

#### **Unstake Tokens Function**
```move
public entry fun unstake_tokens(
    staker: &signer,
    stake_id: String
) acquires StakingStore {
    // Implementation requirements:
    // 1. Validate stake position exists
    // 2. Validate staker owns the position
    // 3. Check if lock period has ended (allow early unstake with penalty)
    // 4. Calculate rewards earned
    // 5. Calculate penalty if early unstake (2% of principal)
    // 6. Transfer principal + rewards - penalty back to staker
    // 7. Update position status to inactive
    // 8. Emit TokensUnstaked event
}
```

#### **Calculate Staking Rewards Function**
```move
public fun calculate_staking_rewards(
    stake_amount: u64,
    tier: u8,
    days_staked: u64
): u64 {
    let apr = if (tier == 4) 15 else if (tier == 3) 12 else if (tier == 2) 10 else 8;
    let annual_rewards = (stake_amount * apr) / 100;
    (annual_rewards * days_staked) / 365
}
```

---

### **4. GOVERNANCE SYSTEM**

#### **Create Milestone Proposal Function**
```move
public entry fun create_milestone_proposal(
    proposer: &signer,
    project_id: String,
    title: String,
    description: String,
    requested_amount: u64
) acquires ProjectStore, GovernanceStore {
    // Implementation requirements:
    // 1. Validate proposer is project creator
    // 2. Validate project exists and is funded
    // 3. Validate requested_amount <= remaining project funds
    // 4. Set voting period (7 days)
    // 5. Initialize votes_for = 0, votes_against = 0
    // 6. Set status = 1 (Voting)
    // 7. Emit ProposalCreated event
}
```

#### **Vote on Milestone Function**
```move
public entry fun vote_on_milestone(
    voter: &signer,
    proposal_id: String,
    support: bool // true = for, false = against
) acquires GovernanceStore, StakingStore, ContributionStore {
    // Implementation requirements:
    // 1. Validate proposal exists and is in voting phase
    // 2. Validate voter hasn't already voted
    // 3. Calculate voter's voting power:
    //    - Base: contribution amount to the project
    //    - Bonus: staking position multiplier
    //    - Minimum: must have contributed ≥5% of project target
    // 4. Add vote to proposal
    // 5. Update votes_for or votes_against
    // 6. Check if voting period ended
    // 7. If ended, determine outcome (51% threshold)
    // 8. Emit VoteCast event
}
```

**Voting Power Calculation:**
```move
public fun calculate_voting_power(
    voter: address,
    project_id: String
): u64 acquires ContributionStore, StakingStore {
    // 1. Sum all contributions by voter to this project
    // 2. Check if voter has active staking positions
    // 3. Apply staking tier multiplier to base voting power
    // 4. Minimum threshold: ≥5% of project target amount
    // 5. Return total voting power
}
```

---

## 🔗 **INTEGRATION INTERFACE REQUIREMENTS**

### **Backend Integration Points**

Our backend Web3Service expects these **exact method signatures**:

```typescript
class AptoscadeWeb3SDK {
  // Project Management
  async createProject(
    creatorAddress: string, 
    projectData: {
      title: string,
      description: string,
      targetAmount: number,
      durationDays: number,
      nftRewardsEnabled: boolean,
      stakingEnabled: boolean
    }
  ): Promise<ProjectResult>

  async processContribution(
    contributorAddress: string,
    contributionData: {
      projectId: string,
      amount: number,
      autoStake: boolean
    }
  ): Promise<ContributionResult>

  // NFT System
  async getNFTMetadata(tokenAddress: string): Promise<NFTMetadata>

  // Staking System
  async stakeTokens(
    userAddress: string,
    stakingData: {
      amount: number,
      lockPeriodDays: number
    }
  ): Promise<StakingResult>

  async unstakeTokens(
    userAddress: string,
    unstakeData: {
      stakeId: string,
      amount: number,
      earlyUnstake: boolean
    }
  ): Promise<UnstakeResult>

  async calculateStakingRewards(stakeTransactionHash: string): Promise<number>

  // Governance System
  async createGovernanceProposal(
    proposerAddress: string,
    proposalData: {
      milestoneId: string,
      title: string,
      description: string,
      requestedAmount: number
    }
  ): Promise<ProposalResult>

  async voteOnProposal(
    voterAddress: string,
    voteData: {
      proposalId: string,
      support: boolean,
      votingPower: number
    }
  ): Promise<VoteResult>

  // Analytics
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics>
  async getUserDashboard(userAddress: string): Promise<UserDashboard>
  async getPlatformAnalytics(): Promise<PlatformAnalytics>

  // Price Oracle
  async getAPTPrice(): Promise<number>
  async convertUSDToAPT(usdAmount: number): Promise<number>
  async convertAPTToUSD(aptAmount: number): Promise<number>
}
```

---

## 🎮 **DETAILED RESPONSE FORMATS**

### **Project Creation Response**
```typescript
interface ProjectResult {
  success: boolean;
  projectHash: string;          // Unique blockchain project identifier
  transactionHash: string;      // Blockchain transaction hash
  blockchainId: string;        // Contract-generated project ID
  nftCollectionAddress?: string; // If NFT rewards enabled
  gasUsed: number;             // Gas fees for transaction
  timestamp: string;           // ISO timestamp
}
```

### **Contribution Response**
```typescript
interface ContributionResult {
  success: boolean;
  transactionHash: string;
  nftReward?: {
    tokenAddress: string;
    tokenId: string;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    mintTransactionHash: string;
    metadataUri: string;
  };
  stakingRecord?: {
    stakeTransactionHash: string;
    stakeId: string;
    amount: number;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    unlocksAt: string;
  };
  gasUsed: number;
}
```

### **NFT Metadata Response**
```typescript
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  collection: {
    name: string;
    description: string;
  };
}
```

### **Staking Response**
```typescript
interface StakingResult {
  success: boolean;
  stakeTransactionHash: string;
  stakeId: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  lockPeriodDays: number;
  unlocksAt: string;
  governancePowerGained: number;
  estimatedAnnualRewards: number;
  gasUsed: number;
}
```

### **Governance Response**
```typescript
interface ProposalResult {
  success: boolean;
  proposalTransactionHash: string;
  blockchainId: string;
  votingPeriodEnds: string;
  gasUsed: number;
}

interface VoteResult {
  success: boolean;
  transactionHash: string;
  votingPower: number;
  voteWeight: number; // 1 for support, -1 for against
  gasUsed: number;
}
```

---

## 📊 **ANALYTICS & DASHBOARD REQUIREMENTS**

### **Project Analytics Response**
```typescript
interface ProjectAnalytics {
  uniqueContributors: number;
  totalContributions: number;
  fundingVelocity: number;     // APT per day
  averageContribution: number;
  topContributorTier: string;
  milestoneCompletionRate: number; // percentage
  governanceParticipation: number; // percentage
  nftsMinted: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}
```

### **User Dashboard Response**
```typescript
interface UserDashboard {
  totalContributed: number;
  projectsBacked: number;
  nftRewards: number;
  stakingBalance: number;
  governancePower: number;
  totalRewardsEarned: number;
  activities: Array<{
    type: "CONTRIBUTION" | "NFT_REWARD" | "STAKING" | "GOVERNANCE_VOTE";
    projectId?: string;
    amount?: number;
    timestamp: string;
    transactionHash: string;
  }>;
}
```

### **Platform Analytics Response**
```typescript
interface PlatformAnalytics {
  totalProjects: number;
  totalContributions: number;
  totalValueLocked: number;    // Total APT in platform
  successRate: number;         // Percentage of funded projects
  averageProjectSize: number;
  nftsMinted: number;
  stakingParticipation: number; // Percentage
  governanceProposals: number;
  activeUsers: number;
}
```

---

## 🔧 **DEPLOYMENT REQUIREMENTS**

### **Development Environment Setup**

1. **Aptos CLI Installation**
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

2. **Project Structure**
```
aptoscade-contracts/
├── Move.toml
├── sources/
│   ├── crowdfunding.move
│   ├── nft_rewards.move
│   ├── staking.move
│   └── governance.move
├── tests/
│   ├── crowdfunding_tests.move
│   └── integration_tests.move
└── scripts/
    ├── deploy.sh
    └── initialize.move
```

3. **Move.toml Configuration**
```toml
[package]
name = "AptoscadeCrowdfunding"
version = "1.0.0"
authors = ["AptosCade Team"]

[addresses]
aptoscade = "_" # Will be filled during deployment

[dev-addresses]
aptoscade = "0x123..." # Your dev address

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-core.git"
rev = "mainnet"
subdir = "aptos-move/framework/aptos-framework"

[dependencies.AptosToken]
git = "https://github.com/aptos-labs/aptos-core.git"
rev = "mainnet"
subdir = "aptos-move/framework/aptos-token"
```

### **Deployment Steps**

#### **Step 1: Testnet Deployment**
```bash
# Initialize account
aptos init --network testnet

# Compile contracts
aptos move compile --package-dir . --named-addresses aptoscade=<your_address>

# Deploy to testnet
aptos move publish --package-dir . --named-addresses aptoscade=<your_address> --network testnet

# Initialize contract state
aptos move run --function-id <your_address>::crowdfunding::initialize --network testnet
```

#### **Step 2: Integration Testing**
```bash
# Test project creation
aptos move run --function-id <address>::crowdfunding::create_project \
  --args string:"Test Project" string:"Description" u64:1000000000 u64:30 bool:true bool:true \
  --network testnet

# Test contribution
aptos move run --function-id <address>::crowdfunding::contribute_to_project \
  --args string:"project_id" u64:100000000 bool:false \
  --network testnet
```

#### **Step 3: Mainnet Deployment**
```bash
# Switch to mainnet
aptos init --network mainnet

# Deploy to mainnet (same commands as testnet)
aptos move publish --package-dir . --named-addresses aptoscade=<your_address> --network mainnet
```

---

## 🔐 **SECURITY REQUIREMENTS**

### **Critical Security Measures**

1. **Access Control**
```move
// Only project creators can create milestones
assert!(signer::address_of(proposer) == project.creator, EUNAUTHORIZED);

// Only contributors can vote
assert!(contribution_exists(voter_address, project_id), EUNAUTHORIZED);
```

2. **Input Validation**
```move
// Validate amounts
assert!(amount > 0, EINVALID_AMOUNT);
assert!(amount <= MAX_CONTRIBUTION, EAMOUNT_TOO_LARGE);

// Validate strings
assert!(string::length(&title) <= MAX_TITLE_LENGTH, ETITLE_TOO_LONG);
```

3. **Reentrancy Protection**
```move
// Use resource guards and proper state updates
let project = borrow_global_mut<Project>(project_address);
project.current_amount = project.current_amount + amount;
coin::transfer<AptosCoin>(contributor, project_address, amount);
```

4. **Emergency Functions**
```move
public entry fun emergency_pause(admin: &signer) acquires PlatformState {
    assert!(signer::address_of(admin) == ADMIN_ADDRESS, EUNAUTHORIZED);
    let state = borrow_global_mut<PlatformState>(@aptoscade);
    state.paused = true;
}
```

### **Audit Requirements**
- [ ] **Input sanitization** on all public functions
- [ ] **Overflow protection** on arithmetic operations
- [ ] **Access control** on administrative functions
- [ ] **Reentrancy guards** on state-changing functions
- [ ] **Gas optimization** for all operations
- [ ] **Event emission** for all major state changes

---

## 🧪 **TESTING REQUIREMENTS**

### **Unit Tests Required**

```move
#[test]
public fun test_create_project() {
    // Test project creation with valid inputs
    // Verify project state is correctly initialized
    // Check events are emitted
}

#[test]
public fun test_contribute_to_project() {
    // Test contribution with various amounts
    // Verify NFT tier calculation
    // Check auto-staking functionality
}

#[test]
public fun test_staking_rewards() {
    // Test reward calculation accuracy
    // Verify different tier multipliers
    // Check early unstake penalties
}

#[test]
public fun test_governance_voting() {
    // Test voting power calculation
    // Verify proposal outcome determination
    // Check authorization requirements
}

#[test]
#[expected_failure(abort_code = EUNAUTHORIZED)]
public fun test_unauthorized_actions() {
    // Test all authorization failures
}
```

### **Integration Test Scenarios**

1. **Full Project Lifecycle**
   - Create project → Multiple contributions → Reach funding goal → Create milestone → Vote → Execute

2. **NFT Reward System**
   - Contribute different amounts → Verify correct NFT tiers → Check metadata

3. **Staking System**
   - Stake different amounts → Wait lock periods → Calculate rewards → Unstake

4. **Governance Flow**
   - Create proposals → Multiple users vote → Reach consensus → Execute outcome

---

## 📋 **DELIVERABLES CHECKLIST**

### **Phase 1: Core Implementation (Days 1-5)**
- [ ] **Project management functions** (create, contribute)
- [ ] **Basic NFT minting** with tier calculation
- [ ] **Staking system** with lock periods
- [ ] **Unit tests** for core functions
- [ ] **Testnet deployment**

### **Phase 2: Advanced Features (Days 6-10)**
- [ ] **Governance system** (proposals, voting)
- [ ] **Analytics functions** (project/user/platform stats)
- [ ] **Price oracle integration** (APT/USD conversion)
- [ ] **Security audit** and optimizations
- [ ] **Integration testing** with backend

### **Phase 3: Production Ready (Days 11-14)**
- [ ] **Mainnet deployment**
- [ ] **Gas optimization**
- [ ] **Error handling** and edge cases
- [ ] **Documentation** and code comments
- [ ] **Backend integration** confirmation

---

## 📞 **COMMUNICATION PROTOCOL**

### **Progress Updates Required**

**Daily Updates:**
```
"Day X Progress:
✅ Completed: [specific functions]
🔄 In Progress: [current work]
⏳ Next: [tomorrow's tasks]
❓ Questions: [any blockers]"
```

**Milestone Updates:**
```
"Milestone: Core Functions Complete
🚀 Deployed to testnet: 0x[address]
📋 Ready for: Backend integration testing
📊 Gas costs: [function costs]
🔍 Need: Backend team testing"
```

### **Required Deliverable Information**

1. **Contract Addresses**
```
TESTNET_CONTRACT=0x[testnet_address]
MAINNET_CONTRACT=0x[mainnet_address]
MODULE_NAME=crowdfunding
ADMIN_ADDRESS=0x[admin_address]
```

2. **Function Gas Costs**
```
create_project: ~0.01 APT
contribute_to_project: ~0.008 APT
stake_tokens: ~0.006 APT
vote_on_milestone: ~0.004 APT
```

3. **Test Transaction Examples**
```
✅ Project Creation: 0x[tx_hash]
✅ Contribution + NFT: 0x[tx_hash] 
✅ Staking: 0x[tx_hash]
✅ Governance Vote: 0x[tx_hash]
```

---

## 🎯 **SUCCESS CRITERIA**

### **Acceptance Testing**

1. **Functional Requirements** ✅
   - All 15+ smart contract functions implemented
   - Response formats match backend interface exactly
   - Gas costs are reasonable (<0.02 APT per transaction)

2. **Security Requirements** ✅
   - No critical vulnerabilities in audit
   - Proper access controls implemented
   - Input validation on all functions

3. **Integration Requirements** ✅
   - Backend can call all functions successfully
   - Error handling works properly
   - Events are emitted correctly

4. **Performance Requirements** ✅
   - Functions execute within acceptable gas limits
   - No transaction failures during testing
   - Scalable for 1000+ users

---

## 🚀 **FINAL DELIVERY PACKAGE**

### **When Complete, Provide:**

1. **📄 Deployment Information**
```env
# Production Environment Variables
WEB3_ENABLED=true
WEB3_CONTRACT_ADDRESS=0x[mainnet_contract_address]
WEB3_MODULE_NAME=crowdfunding
WEB3_NETWORK=mainnet
WEB3_ADMIN_ADDRESS=0x[admin_address]
```

2. **📋 Function Documentation**
- Complete list of all functions with parameters
- Gas cost estimates for each function
- Error codes and meanings
- Example transaction calls

3. **🧪 Test Results**
- Testnet transaction examples for all functions
- Integration test results with backend
- Performance benchmarks
- Security audit report

4. **📚 Integration Guide**
- Step-by-step integration instructions
- Common error scenarios and solutions
- Monitoring and maintenance guidelines

---

## ⏰ **TIMELINE EXPECTATIONS**

### **Realistic Development Schedule**

**Week 1 (Days 1-7):**
- Smart contract architecture design
- Core functions implementation
- Basic testing and debugging
- Testnet deployment

**Week 2 (Days 8-14):**
- Advanced features (governance, analytics)
- Security audit and optimization
- Integration testing with backend
- Mainnet deployment and final delivery

### **Communication Schedule**
- **Daily**: Progress updates via Slack/Discord
- **Weekly**: Video call for detailed review
- **Milestone**: Demo of working functions

---

**📧 NEXT STEPS:**
1. **Review this document** and ask any clarifying questions
2. **Provide timeline estimate** for each phase
3. **Start with testnet deployment** of core functions
4. **Coordinate with backend team** for integration testing

**🎯 Goal: Have a fully functional Web3 crowdfunding platform ready for production deployment within 14 days!**
