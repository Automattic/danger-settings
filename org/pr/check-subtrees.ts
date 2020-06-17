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
export declare function message(message: string): void

type Subtree = {
    repo: string;
    path: string;
}

/*
    This rule scans a PR for changes in a specific subtree and adds
    instructions for merging the changes back into the source repo.
*/
export async function checkSubtrees() {
    // Hard code the subtrees we search for here
    // We may want to define this on a per-repo basis at some point
    const subtrees: Subtree[] = [{
        repo: "wordpress-mobile/WordPress-Login-Flow-Android",
        path: "libs/login/"
    },
    {
        repo: "wordpress-mobile/WordPress-Utils-Android",
        path: "libs/utils/"
    }];

    const modifiedFiles: string[] = danger.git.modified_files;
    const createdFiles: string[] = danger.git.created_files;
    const deletedFiles: string[] = danger.git.deleted_files;

    for (let subtree of subtrees) {
        // Look for subtree changes in the PR.
        console.log(`Scanning PR for changes in ${subtree.path}.`);
        const containsSubtreeChanges = modifiedFiles.some(f => f.includes(subtree.path)) ||
                                    createdFiles.some(f => f.includes(subtree.path)) ||
                                    deletedFiles.some(f => f.includes(subtree.path));

        // If we found changes in the subtree folder, add instructions to the PR.
        if (containsSubtreeChanges) {
            console.log(`PR contains changes in ${subtree.path} subtree.  Adding merge instructions as a warning.`);

            // Handy accessor for some PR info.
            const pr = danger.github.thisPR;

            // The name of the branch that the `subtree push` command will create.
            const mergeBranch = `merge/${pr.repo}/${pr.number}`;

            // The merge instructions.
            let markdownText: string;

            // Put it all together!
            markdownText = `This PR contains changes in the subtree \`${subtree.path}\`. It is your responsibility to ensure these changes are merged back into \`${subtree.repo}\`.  Follow these handy steps!\n`;
            markdownText += `WARNING: *Make sure your git version is 2.19.x or lower* - there is currently a bug in later versions that will corrupt the subtree history!\n`;
            markdownText += `1. \`cd ${pr.repo}\`\n`;
            markdownText += `2. \`git checkout ${danger.github.pr.head.ref}\`\n`;
            markdownText += `3. \`git subtree push --prefix=${subtree.path} https://github.com/${subtree.repo}.git ${mergeBranch}\`\n`;
            markdownText += `4. Browse to https://github.com/${subtree.repo}/pull/new/${mergeBranch} and open a new PR.`;

            message(markdownText);
        }

    }
};

// Not exactly sure why, but in order for the multiple files + import setup to
// work we need to split the export of this function and its declaration as the
// default export. I'm guessing it has to do with how TypeScript resolves
// these?
export default checkSubtrees
