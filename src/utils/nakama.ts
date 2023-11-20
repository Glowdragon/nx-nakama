import { readYamlFile } from "nx/src/utils/fileutils"

/**
 * Returns the database addresses from a Nakama config file.
 * @param configFile The path to the config file.
 */
async function getDatabaseAddresses(configFile: string): Promise<string[]> {
  try {
    const data = readYamlFile(configFile)
    return data.database.address || []
  } catch (e) {
    console.error(`Error reading YAML file: ${e}`)
    throw e
  }
}

export { getDatabaseAddresses }
