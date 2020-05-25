jest.mock("danger", () => jest.fn());
import * as danger from "danger";
const dm = danger as any;

import {checkLabel as label} from "../org/label";

// The mocked data and return values for calls the rule makes.
beforeEach(() => {
    dm.warn = jest.fn().mockReturnValue(true);

    dm.danger = {
        github: {
            issue: {
                labels: []
            },
        },
    };
});

describe("issue label checks", () => {
    it("warns when there is no label", async () => {
        await label();

        expect(dm.warn).toHaveBeenCalledWith("PR is missing at least one label.");
    })

    it("does not warn when there is a label", async () => {
        dm.danger.github.issue.labels = [
            {
                name: 'a label'
            }
        ]

        await label();

        expect(dm.warn).not.toHaveBeenCalled();
    })

    it("does not warn when there are more than one label", async () => {
        dm.danger.github.issue.labels = [
            {
                name: 'a label'
            },
            {
                name: 'another label'
            }
        ]

        await label();

        expect(dm.warn).not.toHaveBeenCalled();
    })
})
