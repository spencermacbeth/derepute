// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title TorReputationStore
 * @dev Stores and manages reputation data for Tor relays on EVM-compatible blockchains
 * @notice This contract allows authorized updaters to store comprehensive Tor relay data on-chain
 * @author Derepute Team
 */
contract TorReputationStore {

    // Constants
    uint256 public constant FINGERPRINT_LENGTH = 40;
    uint256 public constant MAX_UPTIME = 1000; // 0-1000 represents 0.0%-100.0%
    uint256 public constant COUNTRY_CODE_LENGTH = 2; // ISO 3166-1 alpha-2

    /**
     * @dev Struct to store relay reputation data
     * @param fingerprint 40-character hexadecimal unique identifier
     * @param nickname Human-readable relay name
     * @param flags Array of reputation flags (Guard, Exit, Fast, Stable, HSDir, etc.)
     * @param uptime Uptime percentage scaled 0-1000 (0.0% - 100.0%)
     * @param bandwidth Measured bandwidth in bytes per second
     * @param consensusWeight Tor's assignment of relay contribution to network
     * @param country Two-letter ISO 3166-1 alpha-2 country code
     * @param asNumber Autonomous System number as string (e.g., "AS13335")
     * @param lastSeen Unix timestamp when relay was last observed
     * @param running Current operational status of the relay
     */
    struct RelayData {
        string fingerprint;
        string nickname;
        string[] flags;
        uint256 uptime;
        uint256 bandwidth;
        uint256 consensusWeight;
        string country;
        string asNumber;
        uint256 lastSeen;
        bool running;
    }

    // Storage
    address public owner;
    mapping(address => bool) public authorizedUpdaters;
    mapping(string => RelayData) private relaysByFingerprint;
    string[] private fingerprintList; // To enable iteration

    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AuthorizedUpdaterAdded(address indexed updater);
    event AuthorizedUpdaterRemoved(address indexed updater);
    event RelayUpdated(string indexed fingerprint, string nickname);
    event RelayBatchUpdated(uint256 count);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedUpdaters[msg.sender],
            "Only owner or authorized updaters can call this function"
        );
        _;
    }

    /**
     * @dev Constructor sets the initial owner
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @dev Add an authorized updater
     * @param updater Address to authorize for updates
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        require(updater != address(0), "Updater cannot be zero address");
        require(!authorizedUpdaters[updater], "Address already authorized");
        authorizedUpdaters[updater] = true;
        emit AuthorizedUpdaterAdded(updater);
    }

    /**
     * @dev Remove an authorized updater
     * @param updater Address to remove authorization from
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        require(authorizedUpdaters[updater], "Address not authorized");
        authorizedUpdaters[updater] = false;
        emit AuthorizedUpdaterRemoved(updater);
    }

    /**
     * @dev Update a single relay's data
     * @param _fingerprint Relay fingerprint (40-char hex)
     * @param _nickname Relay nickname
     * @param _flags Array of reputation flags
     * @param _uptime Uptime percentage (0-1000)
     * @param _bandwidth Measured bandwidth
     * @param _consensusWeight Consensus weight
     * @param _country Country code
     * @param _asNumber AS number
     * @param _lastSeen Last seen timestamp
     * @param _running Running status
     */
    function updateRelay(
        string calldata _fingerprint,
        string calldata _nickname,
        string[] calldata _flags,
        uint256 _uptime,
        uint256 _bandwidth,
        uint256 _consensusWeight,
        string calldata _country,
        string calldata _asNumber,
        uint256 _lastSeen,
        bool _running
    ) external onlyAuthorized {
        // Input validation
        require(bytes(_fingerprint).length == FINGERPRINT_LENGTH, "Invalid fingerprint length");
        require(_uptime <= MAX_UPTIME, "Uptime exceeds maximum");
        require(bytes(_country).length == COUNTRY_CODE_LENGTH, "Invalid country code");
        require(_lastSeen <= block.timestamp, "Last seen cannot be in future");
        require(bytes(_nickname).length > 0, "Nickname cannot be empty");

        // If this is a new relay, add to fingerprint list
        if (bytes(relaysByFingerprint[_fingerprint].fingerprint).length == 0) {
            fingerprintList.push(_fingerprint);
        }

        relaysByFingerprint[_fingerprint] = RelayData({
            fingerprint: _fingerprint,
            nickname: _nickname,
            flags: _flags,
            uptime: _uptime,
            bandwidth: _bandwidth,
            consensusWeight: _consensusWeight,
            country: _country,
            asNumber: _asNumber,
            lastSeen: _lastSeen,
            running: _running
        });

        emit RelayUpdated(_fingerprint, _nickname);
    }

    /**
     * @dev Batch update multiple relays for gas efficiency
     * @param relays Array of relay data to update
     */
    function batchUpdateRelays(RelayData[] calldata relays) external onlyAuthorized {
        for (uint256 i = 0; i < relays.length; i++) {
            RelayData calldata relay = relays[i];

            // Input validation
            require(bytes(relay.fingerprint).length == FINGERPRINT_LENGTH, "Invalid fingerprint length");
            require(relay.uptime <= MAX_UPTIME, "Uptime exceeds maximum");
            require(bytes(relay.country).length == COUNTRY_CODE_LENGTH, "Invalid country code");
            require(relay.lastSeen <= block.timestamp, "Last seen cannot be in future");
            require(bytes(relay.nickname).length > 0, "Nickname cannot be empty");

            // If this is a new relay, add to fingerprint list
            if (bytes(relaysByFingerprint[relay.fingerprint].fingerprint).length == 0) {
                fingerprintList.push(relay.fingerprint);
            }

            relaysByFingerprint[relay.fingerprint] = relay;
        }

        emit RelayBatchUpdated(relays.length);
    }

    /**
     * @dev Get relay data by fingerprint
     * @param fingerprint The relay's fingerprint
     * @return RelayData struct containing all relay information
     */
    function getRelay(string calldata fingerprint) external view returns (RelayData memory) {
        require(bytes(relaysByFingerprint[fingerprint].fingerprint).length > 0, "Relay not found");
        return relaysByFingerprint[fingerprint];
    }

    /**
     * @dev Get total number of relays stored
     * @return Total count of relays
     */
    function getRelayCount() external view returns (uint256) {
        return fingerprintList.length;
    }

    /**
     * @dev Get relay fingerprint by index
     * @param index Index in the fingerprint list
     * @return Fingerprint string
     */
    function getFingerprintByIndex(uint256 index) external view returns (string memory) {
        require(index < fingerprintList.length, "Index out of bounds");
        return fingerprintList[index];
    }

    /**
     * @dev Get multiple relays by pagination
     * @param offset Starting index
     * @param limit Number of relays to return
     * @return Array of RelayData structs
     */
    function getRelaysPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (RelayData[] memory)
    {
        require(offset < fingerprintList.length, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > fingerprintList.length) {
            end = fingerprintList.length;
        }

        uint256 resultLength = end - offset;
        RelayData[] memory result = new RelayData[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            string memory fingerprint = fingerprintList[offset + i];
            result[i] = relaysByFingerprint[fingerprint];
        }

        return result;
    }

    /**
     * @dev Check if a relay exists
     * @param fingerprint The relay's fingerprint
     * @return Boolean indicating if relay exists
     */
    function relayExists(string calldata fingerprint) external view returns (bool) {
        return bytes(relaysByFingerprint[fingerprint].fingerprint).length > 0;
    }
}
