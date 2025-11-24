/**
 * TypeScript types for Tor relay data and Onionoo API responses
 */

// Onionoo API response types
export interface OnionooRelay {
  n?: string; // nickname
  f?: string; // fingerprint
  a?: string[]; // or_addresses
  r?: boolean; // running
  t?: string; // last_changed_address_or_port (ISO timestamp)

  // From details endpoint
  nickname?: string;
  fingerprint?: string;
  or_addresses?: string[];
  exit_addresses?: string[];
  dir_address?: string;
  last_seen?: string; // ISO timestamp
  last_changed_address_or_port?: string;
  first_seen?: string;
  running?: boolean;
  flags?: string[];
  country?: string;
  country_name?: string;
  region_name?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  as_number?: string;
  as_name?: string;
  consensus_weight?: number;
  host_name?: string;
  measured_bandwidth?: number;
  advertised_bandwidth?: number;
  exit_policy?: string[];
  exit_policy_summary?: {
    accept?: string[];
    reject?: string[];
  };
  contact?: string;
  platform?: string;
  version?: string;
  version_status?: string;
  effective_family?: string[];
  alleged_family?: string[];
  indirect_family?: string[];
  consensus_weight_fraction?: number;
  guard_probability?: number;
  middle_probability?: number;
  exit_probability?: number;
  recommended_version?: boolean;
  hibernating?: boolean;
  overload_general_timestamp?: string;
}

export interface OnionooDetailsResponse {
  version?: string;
  next_major_version_scheduled?: string;
  relays_published?: string;
  relays?: OnionooRelay[];
  bridges_published?: string;
  bridges?: OnionooRelay[];
}

export interface OnionooUptimeData {
  [key: string]: {
    [key: string]: number; // date -> uptime value
  };
}

export interface OnionooUptimeResponse {
  version?: string;
  relays_published?: string;
  relays?: Array<{
    fingerprint: string;
    uptime?: OnionooUptimeData;
  }>;
  bridges_published?: string;
  bridges?: any[];
}

// Contract relay data type
export interface RelayData {
  fingerprint: string;
  nickname: string;
  flags: string[];
  uptime: number; // 0-1000 (representing 0.0% - 100.0%)
  bandwidth: number; // bytes/sec
  consensusWeight: number;
  country: string;
  asNumber: string;
  lastSeen: number; // Unix timestamp
  running: boolean;
}

// Configuration types
export interface ScriptConfig {
  contractAddress: string;
  network: string;
  rpcUrl: string;
  updaterPrivateKey: string;
  onionooBaseUrl: string;
  maxRelaysToFetch: number;
  batchSize: number;
  dryRun: boolean;
}

// Utility types
export interface FetchOptions {
  limit?: number;
  offset?: number;
  running?: boolean;
  country?: string;
  flag?: string;
  order?: string;
  fields?: string;
}

export interface TransformOptions {
  normalizeUptime?: boolean;
  filterInvalid?: boolean;
  sortBy?: keyof RelayData;
}

export interface UpdateResult {
  success: boolean;
  relaysUpdated: number;
  transactionHash?: string;
  gasUsed?: bigint;
  error?: string;
}
