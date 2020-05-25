jest.mock("danger", () => jest.fn());
import * as danger from "danger";
const dm = danger as any;

import { checkMilestone as milestone } from "../org/milestone";

// The mocked data and return values for calls the rule makes.
beforeEach(() => {
  dm.warn = jest.fn().mockReturnValue(true);

  dm.danger = {
    github: {
      api: {
        issues: {
          get: jest.fn(),
        },
      },
      issue: {
        labels: [],
      }
    },
  };
});

describe("PR milestone checks", () => {
  it("warns with missing milestone", async () => {
    dm.danger.github.api.issues.get.mockReturnValueOnce(Promise.resolve({ data: { milestone: null } }))

    await milestone();

    expect(dm.warn).toHaveBeenCalledWith("PR is not assigned to a milestone.");
  })

  it("does not warn when the milestone is present", async () => {
    dm.danger.github.api.issues.get.mockReturnValueOnce(Promise.resolve({ data: { milestone: [{ number: 1 }] } }))

    await milestone();

    expect(dm.warn).not.toHaveBeenCalled();
  })
})
