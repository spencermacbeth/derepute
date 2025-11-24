import axios, { AxiosInstance } from "axios";
import {
  OnionooDetailsResponse,
  OnionooRelay,
  FetchOptions,
} from "../types";

/**
 * Client for interacting with the Onionoo API
 * https://metrics.torproject.org/onionoo.html
 */
export class OnionooClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = "https://onionoo.torproject.org") {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        "User-Agent": "Derepute/1.0 (Tor Reputation Store)",
      },
    });
  }

  /**
   * Fetch relay details from Onionoo
   * @param options Fetch options for filtering and pagination
   * @returns Array of relay data
   */
  async fetchRelayDetails(options: FetchOptions = {}): Promise<OnionooRelay[]> {
    try {
      console.log("🔍 Fetching relay data from Onionoo API...");

      const params: any = {};

      // Add filters
      if (options.running !== undefined) {
        params.running = options.running;
      }
      if (options.country) {
        params.country = options.country;
      }
      if (options.flag) {
        params.flag = options.flag;
      }
      if (options.order) {
        params.order = options.order;
      }
      if (options.offset !== undefined) {
        params.offset = options.offset;
      }
      if (options.limit !== undefined) {
        params.limit = options.limit;
      }
      if (options.fields) {
        params.fields = options.fields;
      }

      const response = await this.client.get<OnionooDetailsResponse>("/details", {
        params,
      });

      const relays = response.data.relays || [];
      console.log(`✅ Fetched ${relays.length} relays from Onionoo`);

      return relays;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Onionoo API error:", error.message);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
      } else {
        console.error("❌ Unexpected error:", error);
      }
      throw error;
    }
  }

  /**
   * Fetch top relays by consensus weight
   * @param limit Number of top relays to fetch
   * @returns Array of relay data
   */
  async fetchTopRelays(limit: number = 100): Promise<OnionooRelay[]> {
    console.log(`🔝 Fetching top ${limit} relays by consensus weight...`);

    return this.fetchRelayDetails({
      running: true,
      order: "-consensus_weight",
      limit,
    });
  }

  /**
   * Fetch relays with specific flags
   * @param flags Array of flags to filter by (e.g., ["Guard", "Exit"])
   * @param limit Number of relays to fetch
   * @returns Array of relay data
   */
  async fetchRelaysByFlags(
    flags: string[],
    limit: number = 100
  ): Promise<OnionooRelay[]> {
    console.log(`🚩 Fetching relays with flags: ${flags.join(", ")}...`);

    // Onionoo API accepts comma-separated flags
    return this.fetchRelayDetails({
      running: true,
      flag: flags.join(","),
      limit,
    });
  }

  /**
   * Fetch relays from a specific country
   * @param countryCode ISO 3166-1 alpha-2 country code
   * @param limit Number of relays to fetch
   * @returns Array of relay data
   */
  async fetchRelaysByCountry(
    countryCode: string,
    limit: number = 100
  ): Promise<OnionooRelay[]> {
    console.log(`🌍 Fetching relays from country: ${countryCode}...`);

    return this.fetchRelayDetails({
      running: true,
      country: countryCode,
      limit,
    });
  }

  /**
   * Fetch a specific relay by fingerprint
   * @param fingerprint 40-character hex fingerprint
   * @returns Relay data or null if not found
   */
  async fetchRelayByFingerprint(
    fingerprint: string
  ): Promise<OnionooRelay | null> {
    console.log(`🔎 Fetching relay with fingerprint: ${fingerprint}...`);

    try {
      const response = await this.client.get<OnionooDetailsResponse>("/details", {
        params: {
          lookup: fingerprint,
        },
      });

      const relays = response.data.relays || [];
      return relays.length > 0 ? relays[0] : null;
    } catch (error) {
      console.error(`❌ Error fetching relay ${fingerprint}:`, error);
      return null;
    }
  }

  /**
   * Fetch all Guard relays
   * @param limit Number of relays to fetch
   * @returns Array of Guard relay data
   */
  async fetchGuardRelays(limit: number = 100): Promise<OnionooRelay[]> {
    return this.fetchRelaysByFlags(["Guard"], limit);
  }

  /**
   * Fetch all Exit relays
   * @param limit Number of relays to fetch
   * @returns Array of Exit relay data
   */
  async fetchExitRelays(limit: number = 100): Promise<OnionooRelay[]> {
    return this.fetchRelaysByFlags(["Exit"], limit);
  }

  /**
   * Get API status and version
   * @returns API version and relay count info
   */
  async getApiStatus(): Promise<{
    version?: string;
    relaysPublished?: string;
    relayCount?: number;
  }> {
    try {
      const response = await this.client.get<OnionooDetailsResponse>("/details", {
        params: { limit: 1 },
      });

      return {
        version: response.data.version,
        relaysPublished: response.data.relays_published,
        relayCount: response.data.relays?.length || 0,
      };
    } catch (error) {
      console.error("❌ Error fetching API status:", error);
      throw error;
    }
  }
}
