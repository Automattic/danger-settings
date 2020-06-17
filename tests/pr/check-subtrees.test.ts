import checkSubtrees from "../../org/pr/check-subtrees";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any
beforeEach(() => {
  global.message = jest.fn()
    global.danger = {
      git: {
        created_files: [],
        deleted_files: []
      },
      github: {
        pr: {
          head: {
            ref: "test-branch",
          }
        },
        thisPR: {
          repo: "test-wordpress-mobile",
          number: -1,
        },
      },
    }
})

describe("subtree checks", () => {
  it("adds merge instructions when PR contains changes in libs/login/", async () => {
    global.danger.git.modified_files = [ "libs/login/modified-file.txt" ]

    await checkSubtrees();

    // First, check that the merge instructions appear correct.
    expect(global.message).toHaveBeenCalledWith(expect.stringContaining("This PR contains changes in the subtree `libs/login/`. It is your responsibility to ensure these changes are merged back into `wordpress-mobile/WordPress-Login-Flow-Android`."));

    // Then, ensure a piece of mock data is present.
    expect(global.message).toHaveBeenCalledWith(expect.stringContaining(global.danger.github.thisPR.repo));
  })

  it("adds merge instructions when PR contains changes in libs/utils/", async () => {
    global.danger.git.modified_files = [ "libs/utils/modified-file.txt" ]

    await checkSubtrees();

    // First, check that the merge instructions appear correct.
    expect(global.message).toHaveBeenCalledWith(expect.stringContaining("This PR contains changes in the subtree `libs/utils/`. It is your responsibility to ensure these changes are merged back into `wordpress-mobile/WordPress-Utils-Android`."));

    // Then, ensure a piece of mock data is present.
    expect(global.message).toHaveBeenCalledWith(expect.stringContaining(global.danger.github.thisPR.repo));
  })

  it("adds does not add merge instructions when PR does not contain changes in libs/utils/ or libs/login", async () => {
    global.danger.git.modified_files = [ "any-file.ts" ]

    await checkSubtrees();

    expect(global.message).not.toHaveBeenCalled();
  })
})
