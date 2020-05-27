import { checkDiffSize as diff } from "../../org/pr/diff-size";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.warn = jest.fn()
  global.danger = {
    github: {
      issue: {
        labels: []
      },
      pr: {
        additions: 10,
        deletions: 10
      }
   }
  }
})

describe("PR diff size checks", () => {
    it("does not warn with less than 500 lines", async () => {
        await diff();

        expect(global.warn).not.toHaveBeenCalled();
    })

    it("warns with more than 500 lines", async () => {
        global.danger.github.pr.additions = 200;
        global.danger.github.pr.deletions = 301;

        await diff();

        expect(global.warn).toHaveBeenCalledWith("PR has more than 500 lines of code changing. Consider splitting into smaller PRs if possible.");
    })

    it("does not warn with more than 500 lines and releases label", async () => {
        global.danger.github.pr.additions = 200;
        global.danger.github.pr.deletions = 301;

        global.danger.github.issue.labels = [
            {
                name: 'Releases'
            },
        ]

        await diff();

        expect(global.warn).not.toHaveBeenCalled();
    })
})
