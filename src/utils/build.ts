import { workspaceRoot } from "@nx/devkit"
import { copyFileSync } from "fs-extra"
import { executeCommand } from "./exec"
import { posixJoin } from "./posix"

/**
 * Compiles the TypeScript code in the project root.
 * @param projectRoot The path to the project root, relative to the workspace root.
 * @param outputPath The path to the output directory, relative to the workspace root.
 */
async function createBuild(projectRoot: string, outputPath: string) {
  const outputFile = posixJoin(workspaceRoot, outputPath, "data", "modules", "main.js")
  const command = `npx rollup -c --bundleConfigAsCjs --file ${outputFile}`
  await executeCommand(command, posixJoin(workspaceRoot, projectRoot))
}

/**
 * Copies a config file from the project root to the output path.
 * @param projectRoot The path to the project root, relative to the workspace root.
 * @param outputPath The path to the output directory, relative to the workspace root.
 * @param configFileName The name of the config file to copy, relative to the project root.
 */
function copyConfigFile(projectRoot: string, outputPath: string, configFileName: string) {
  copyFileSync(
    posixJoin(workspaceRoot, projectRoot, configFileName),
    posixJoin(workspaceRoot, outputPath, configFileName)
  )
}

export { createBuild, copyConfigFile }
