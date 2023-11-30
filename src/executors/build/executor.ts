import { BuildExecutorSchema } from "./schema"
import { ExecutorContext } from "@nx/devkit"
import { createBuild, copyConfigFile } from "../../utils/build"

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  const { outputPath, configFileName } = options
  const projectRoot = context.projectGraph.nodes[context.projectName].data.root

  // Create build
  await createBuild(projectRoot, outputPath)

  // Copy config file if specified
  if (configFileName !== undefined) {
    copyConfigFile(projectRoot, outputPath, configFileName)
  }

  return { success: true }
}
