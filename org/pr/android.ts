// Danger ignores Danger's imports at runtime and actually would give a build
// failure if we tried to use them here and then import this file. What authors
// should do, instead, is simply assume it's there.
//
// See https://danger.systems/js/usage/extending-danger.html#writing-your-plugin
//
// In order to write tests for these files, though, we need to define
// interfaces for the Danger functionalities we'll use. These don't affect
// runtime and do provide better dev-time typing experience.
//
// A richer example of this can be found here:
// https://github.com/orta/danger-plugin-yarn/blob/5e906e57331b952afced3f6e773ed6c68d5898c0/src/index.ts#L1-L8
import { DangerDSLType } from "../../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function warn(message: string): void

export async function androidSafetyChecks() {
    // If changes were made to the release notes, there must also be changes to the PlayStoreStrings file.
    const modifiedFiles = danger.git.modified_files;
    const hasModifiedReleaseNotes = modifiedFiles.some(f => f.endsWith("metadata/release_notes.txt"));
    const hasModifiedPlayStoreStrings = modifiedFiles.some(f => f.includes("metadata/PlayStoreStrings.po"));

    if (hasModifiedReleaseNotes && !hasModifiedPlayStoreStrings) {
        warn("The PlayStoreStrings.po file must be updated any time changes are made to release notes.");
    }
};

// Not exactly sure why, but in order for the multiple files + import setup
// to work we need to split the export of this function and its declaration
// as the default export. I'm guessing it has to do with how TypeScript
// resolves these?
export default androidSafetyChecks
