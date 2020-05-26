import {checkLabel as label} from "../org/label";

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
      }
    }
  }
})

describe("issue label checks", () => {
  it("warns when there is no label", async () => {
    await label();

    expect(global.warn).toHaveBeenCalledWith("PR is missing at least one label.");
  })

  it("does not warn when there is a label", async () => {
    global.danger.github.issue.labels = [
      {
        name: 'a label'
      }
    ]

    await label();

    expect(global.warn).not.toHaveBeenCalled();
  })

  it("does not warn when there are more than one label", async () => {
    global.danger.github.issue.labels = [
      {
        name: 'a label'
      },
      {
        name: 'another label'
      }
    ]

    await label();

    expect(global.warn).not.toHaveBeenCalled();
  })
})
