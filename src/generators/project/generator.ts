import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  ProjectConfiguration,
  Tree,
} from "@nx/devkit"
import { ProjectGeneratorSchema } from "./schema"
import { installPackage, installPackages } from "../../utils/package-manager"
import { posixJoin } from "../../utils/posix"

export async function projectGenerator(tree: Tree, options: ProjectGeneratorSchema) {
  const { name: projectName } = options
  const projectRoot = posixJoin(getWorkspaceLayout(tree).appsDir, projectName)

  // Create project.json
  addProjectConfiguration(tree, projectName, getProjectJsonContent(projectName, projectRoot))

  // Install Nakama package
  await installPackage("", "github:heroiclabs/nakama-common", false)

  // Install dev dependencies
  const devDependencies = [
    "@babel/core",
    "@babel/plugin-external-helpers",
    "@babel/preset-env",
    "@rollup/plugin-babel",
    "@rollup/plugin-commonjs",
    "@rollup/plugin-json",
    "@rollup/plugin-node-resolve",
    "@rollup/plugin-typescript",
    "rollup",
    "tslib",
  ]
  await installPackages("", devDependencies, true)

  // Copy files
  generateFiles(tree, posixJoin(__dirname, "files"), projectRoot, options)

  return formatFiles(tree)
}

/**
 * Returns the content of the project.json file.
 */
function getProjectJsonContent(projectName: string, projectRoot: string): ProjectConfiguration {
  return {
    root: projectRoot,
    projectType: "application",
    sourceRoot: `${projectRoot}/src`,
    targets: {
      build: {
        executor: "nx-nakama:build",
        options: {
          outputPath: `dist/apps/${projectName}`,
          configFileName: "config.yml",
        },
      },
      serve: {
        executor: "nx-nakama:serve",
        options: {
          configFileName: "config.yml",
        },
      },
    },
  }
}

export default projectGenerator
