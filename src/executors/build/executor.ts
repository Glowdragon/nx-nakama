import { BuildExecutorSchema } from "./schema"
import { ExecutorContext } from "@nx/devkit"
import { compileTypeScript, copyConfigFile } from "../../utils/build"
import { installPackages } from "../../utils/package-manager"
import { directoryExists } from "@nx/plugin/testing"
import * as path from "path"

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  const { outputPath, configFileName } = options
  const projectRoot = context.projectGraph.nodes[context.projectName].data.root

  // Install packages if necessary
  if (!directoryExists(path.join(projectRoot, "node_modules"))) {
    await installPackages(projectRoot)
  }

  // Compile TypeScript and copy config file
  await compileTypeScript(projectRoot, outputPath)
  if (configFileName !== undefined) {
    copyConfigFile(projectRoot, outputPath, configFileName)
  }

  return { success: true }
}
