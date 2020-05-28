import {installableBuild} from "../org/installable-build";

// Because Danger strips Danger's imports at runtime, we don't import Danger in
// our sources. Instead, we simply assume they exist in the global namespace.
// In the tests, we need to provide a test double for everything, though.
declare const global: any

beforeEach(() => {
  global.console = {
    log: jest.fn()
  }
  global.warn = jest.fn()
  global.danger = {
    github: {
      issue: {
        labels: []
      }
    }
  }
})

describe("installable build handling", () => {
  it("bails when it's not a status/state we want to handle", async () => {
    // The original source casts as any, I'm guessing to work around the need to add extra information to the typed value.
    // Argument of type     '{ state: string; context: string; }' is not assignable to parameter of type              'Status'. Type '{ state: string; context: string; }' is missing the following             properties from type 'Status': id, sha, name, commit, and 5 more.
    // Later on, I'd like to do something about this, for example by creating a
    // builder function in this test for it.
    await installableBuild({ state: "fail", context: "Failure context" } as any);
    expect(console.log).toBeCalledWith(
      "Not a status we want to process for installable builds - got 'Failure context' (fail)"
    )

    await installableBuild({ state: "success", context: "ci/circleci: Installable Build/Hold" } as any)
    expect(console.log).toBeCalledWith(
      "Not a status we want to process for installable builds - got 'ci/circleci: Installable Build/Hold' (success)"
    )
  })
})
