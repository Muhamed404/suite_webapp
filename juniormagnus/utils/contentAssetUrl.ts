/**
 * Content Asset URL Utilities
 *
 * Re-exports from the centralized awmStorage service for backward compatibility.
 * All existing imports of these functions continue to work unchanged.
 */
export {
  getContentAssetUrl,
  getModuleAssetUrl,
  getCertificateAssetUrl,
} from "@/services/jnrStorage";
