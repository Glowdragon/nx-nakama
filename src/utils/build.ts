import { workspaceRoot } from "@nx/devkit"
import { copyFileSync } from "fs-extra"
import * as path from "path"
import { executeCommand } from "./exec"

/**
 * Compiles the TypeScript code in the project root.
 * @param projectRoot The path to the project root, relative to the workspace root.
 * @param outputPath The path to the output directory, relative to the workspace root.
 */
async function compileTypeScript(projectRoot: string, outputPath: string) {
  await executeCommand(
    "tsc --outDir " + path.join(workspaceRoot, outputPath, "data", "modules"),
    path.join(workspaceRoot, projectRoot)
  )
}

/**
 * Copies a config file from the project root to the output path.
 * @param projectRoot The path to the project root, relative to the workspace root.
 * @param outputPath The path to the output directory, relative to the workspace root.
 * @param configFileName The name of the config file to copy, relative to the project root.
 */
function copyConfigFile(projectRoot: string, outputPath: string, configFileName: string) {
  copyFileSync(
    path.join(workspaceRoot, projectRoot, configFileName),
    path.join(workspaceRoot, outputPath, configFileName)
  )
}

export { compileTypeScript, copyConfigFile }