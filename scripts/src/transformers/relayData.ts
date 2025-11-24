import { OnionooRelay, RelayData, TransformOptions } from "../types";

// Constants for relay data transformation
const FINGERPRINT_LENGTH = 40;
const MAX_UPTIME = 1000; // 0-1000 represents 0.0%-100.0%
const DEFAULT_RUNNING_UPTIME = 950; // High uptime for running relays without consensus weight
const FALLBACK_RUNNING_UPTIME = 900; // Fallback uptime for running relays
const CONSENSUS_WEIGHT_MULTIPLIER = 50000; // Multiplier to scale consensus_weight_fraction to uptime
const DEFAULT_COUNTRY_CODE = "??"; // Unknown country
const DEFAULT_AS_NUMBER = "AS0"; // Unknown AS number

/**
 * Transforms Onionoo API relay data to contract-compatible format
 */
export class RelayDataTransformer {
  /**
   * Transform a single Onionoo relay to contract RelayData format
   * @param relay Onionoo relay data
   * @returns Contract-compatible relay data or null if invalid
   */
  static transformRelay(relay: OnionooRelay): RelayData | null {
    try {
      // Validate required fields
      const fingerprint = relay.fingerprint || relay.f;
      if (!fingerprint || fingerprint.length !== FINGERPRINT_LENGTH) {
        console.warn(`⚠️  Invalid fingerprint: ${fingerprint}`);
        return null;
      }

      const nickname = relay.nickname || relay.n || "Unknown";
      const flags = relay.flags || [];
      const running = relay.running ?? relay.r ?? false;

      // Parse last seen timestamp (Unix timestamp in seconds)
      // Onionoo API returns timestamps in ISO 8601 UTC format
      const now = Math.floor(Date.now() / 1000);
      let lastSeen = now; // Default to now
      const lastSeenStr = relay.last_seen || relay.t;
      if (lastSeenStr) {
        // Ensure UTC parsing by using Date.parse with explicit UTC handling
        // If the string doesn't end with 'Z', treat it as UTC
        const utcString = lastSeenStr.includes('Z') ? lastSeenStr : lastSeenStr.replace(' ', 'T') + 'Z';
        const parsedDate = new Date(utcString);
        if (!isNaN(parsedDate.getTime())) {
          const parsedTimestamp = Math.floor(parsedDate.getTime() / 1000);
          // Cap at current time to avoid "future timestamp" validation errors
          // This handles any remaining clock skew
          lastSeen = Math.min(parsedTimestamp, now);
        }
      }

      // Calculate uptime (0-1000 representing 0.0% - 100.0%)
      // If running, default to high uptime; otherwise estimate from consensus weight
      let uptime = running ? DEFAULT_RUNNING_UPTIME : 0;

      // Use consensus_weight_fraction as a proxy for uptime if available
      if (relay.consensus_weight_fraction !== undefined) {
        // Higher consensus weight usually means higher uptime
        // Scale to 0-1000 range, capping at reasonable values
        uptime = Math.min(MAX_UPTIME, Math.floor(relay.consensus_weight_fraction * CONSENSUS_WEIGHT_MULTIPLIER));
      } else if (running) {
        // If running but no consensus weight, assume good uptime
        uptime = FALLBACK_RUNNING_UPTIME;
      }

      // Get bandwidth (prefer measured, fallback to advertised)
      const bandwidth = relay.measured_bandwidth || relay.advertised_bandwidth || 0;

      // Get consensus weight (default to 0 if not available)
      const consensusWeight = relay.consensus_weight || 0;

      // Get country code (default to "??" for unknown)
      const country = relay.country || DEFAULT_COUNTRY_CODE;

      // Get AS number (format: "AS12345" or just "12345")
      let asNumber = relay.as_number || DEFAULT_AS_NUMBER;
      if (!asNumber.startsWith("AS")) {
        asNumber = `AS${asNumber}`;
      }

      return {
        fingerprint: fingerprint.toUpperCase(),
        nickname,
        flags,
        uptime,
        bandwidth,
        consensusWeight,
        country,
        asNumber,
        lastSeen,
        running,
      };
    } catch (error) {
      console.error("❌ Error transforming relay:", error);
      return null;
    }
  }

  /**
   * Transform multiple Onionoo relays to contract format
   * @param relays Array of Onionoo relays
   * @param options Transformation options
   * @returns Array of contract-compatible relay data
   */
  static transformRelays(
    relays: OnionooRelay[],
    options: TransformOptions = {}
  ): RelayData[] {
    console.log(`🔄 Transforming ${relays.length} relays...`);

    let transformed: RelayData[] = [];

    for (const relay of relays) {
      const relayData = this.transformRelay(relay);
      if (relayData) {
        transformed.push(relayData);
      }
    }

    // Filter invalid entries if requested
    if (options.filterInvalid !== false) {
      transformed = transformed.filter((relay) => this.validateRelayData(relay));
    }

    // Sort if requested
    if (options.sortBy) {
      transformed = this.sortRelays(transformed, options.sortBy);
    }

    console.log(`✅ Successfully transformed ${transformed.length} relays`);
    return transformed;
  }

  /**
   * Validate relay data meets contract requirements
   * @param relay Relay data to validate
   * @returns True if valid, false otherwise
   */
  static validateRelayData(relay: RelayData): boolean {
    // Fingerprint must be exactly 40 characters
    if (!relay.fingerprint || relay.fingerprint.length !== 40) {
      console.warn(`⚠️  Invalid fingerprint length: ${relay.fingerprint}`);
      return false;
    }

    // Uptime must be <= 1000
    if (relay.uptime > 1000) {
      console.warn(`⚠️  Invalid uptime: ${relay.uptime} for ${relay.fingerprint}`);
      return false;
    }

    // Nickname should not be empty
    if (!relay.nickname || relay.nickname.trim() === "") {
      console.warn(`⚠️  Empty nickname for ${relay.fingerprint}`);
      return false;
    }

    return true;
  }

  /**
   * Sort relays by a specific field
   * @param relays Array of relays
   * @param sortBy Field to sort by
   * @param descending Sort in descending order (default: true)
   * @returns Sorted array of relays
   */
  static sortRelays(
    relays: RelayData[],
    sortBy: keyof RelayData,
    descending: boolean = true
  ): RelayData[] {
    return [...relays].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return descending ? bVal - aVal : aVal - bVal;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return descending
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }

      return 0;
    });
  }

  /**
   * Batch relays into groups for efficient contract updates
   * @param relays Array of relays
   * @param batchSize Size of each batch
   * @returns Array of relay batches
   */
  static batchRelays(relays: RelayData[], batchSize: number): RelayData[][] {
    const batches: RelayData[][] = [];

    for (let i = 0; i < relays.length; i += batchSize) {
      batches.push(relays.slice(i, i + batchSize));
    }

    console.log(
      `📦 Created ${batches.length} batches of ${batchSize} relays (last batch: ${
        batches[batches.length - 1]?.length || 0
      })`
    );

    return batches;
  }

  /**
   * Get summary statistics of relay data
   * @param relays Array of relays
   * @returns Summary statistics
   */
  static getSummaryStats(relays: RelayData[]): {
    totalRelays: number;
    runningRelays: number;
    totalBandwidth: number;
    avgUptime: number;
    flagCounts: Record<string, number>;
    countryCounts: Record<string, number>;
  } {
    const stats = {
      totalRelays: relays.length,
      runningRelays: 0,
      totalBandwidth: 0,
      avgUptime: 0,
      flagCounts: {} as Record<string, number>,
      countryCounts: {} as Record<string, number>,
    };

    let totalUptime = 0;

    for (const relay of relays) {
      if (relay.running) stats.runningRelays++;
      stats.totalBandwidth += relay.bandwidth;
      totalUptime += relay.uptime;

      // Count flags
      for (const flag of relay.flags) {
        stats.flagCounts[flag] = (stats.flagCounts[flag] || 0) + 1;
      }

      // Count countries
      stats.countryCounts[relay.country] =
        (stats.countryCounts[relay.country] || 0) + 1;
    }

    stats.avgUptime = relays.length > 0 ? totalUptime / relays.length : 0;

    return stats;
  }

  /**
   * Filter relays by minimum consensus weight
   * @param relays Array of relays
   * @param minWeight Minimum consensus weight
   * @returns Filtered array of relays
   */
  static filterByMinWeight(
    relays: RelayData[],
    minWeight: number
  ): RelayData[] {
    const filtered = relays.filter(
      (relay) => relay.consensusWeight >= minWeight
    );
    console.log(
      `🔍 Filtered ${relays.length} -> ${filtered.length} relays with min weight ${minWeight}`
    );
    return filtered;
  }

  /**
   * Filter relays by specific flags
   * @param relays Array of relays
   * @param requiredFlags Flags that must be present
   * @returns Filtered array of relays
   */
  static filterByFlags(
    relays: RelayData[],
    requiredFlags: string[]
  ): RelayData[] {
    const filtered = relays.filter((relay) =>
      requiredFlags.every((flag) => relay.flags.includes(flag))
    );
    console.log(
      `🚩 Filtered ${relays.length} -> ${filtered.length} relays with flags: ${requiredFlags.join(
        ", "
      )}`
    );
    return filtered;
  }
}
