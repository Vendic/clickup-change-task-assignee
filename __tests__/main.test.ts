import * as core from '@actions/core'
import * as fs from "fs";
import nock from "nock";
import run from "../src/main";

describe('Assigns the task to Bar and Baz, removes user Foo', () => {
    it('does a call to the Clickup API', async () => {
        // Mocks
        const infoMock = jest.spyOn(core, 'info')
        const debugMock = jest.spyOn(core, 'debug')
        const failedMock = jest.spyOn(core, 'setFailed')

        const getReply = fs.readFileSync(__dirname + '/' + 'get_response.json', 'utf-8')
        nock('https://api.clickup.com')
            .persist()
            .get('/api/v2/task/MAX-185/?custom_task_ids=true&team_id=123')
            .reply(200, getReply)
        const putReply = fs.readFileSync(__dirname + '/' + 'put_response.json', 'utf-8')
        nock('https://api.clickup.com')
            .persist()
            .put('/api/v2/task/MAX-185/?custom_task_ids=true&team_id=123')
            .reply(200, putReply)

        await run()

        // Assertions
        const body  = {
            "assignees": {
                "add": [
                    3
                ],
                "rem": [
                    1
                ]
            }
        }

        expect(failedMock).toHaveBeenCalledTimes(0)
        expect(debugMock).toHaveBeenCalledWith(JSON.stringify(body))
        expect(infoMock).toHaveBeenCalledWith('MAX-185 assigned to Bar')
        expect(infoMock).toHaveBeenCalledWith('MAX-185 assigned to Baz')
        expect(infoMock).toHaveBeenCalledTimes(2)
    })
})

beforeEach(() => {
    jest.resetModules()
    process.env['INPUT_CLICKUP_TOKEN'] = 'pk_123'
    process.env['INPUT_CLICKUP_CUSTOM_TASK_IDS'] = 'MAX-185'
    process.env['INPUT_CLICKUP_TEAM_ID'] = '123'
    process.env['INPUT_TARGET_ASSIGNEES_USERNAMES'] = 'bar\nbaz\nsome-random-user'
    process.env['INPUT_CLICKUP_USER_ID_MAPPING_PATH'] = __dirname + '/' + 'user_mapping.json'
})

afterEach(() => {
    delete process.env['INPUT_CLICKUP_TOKEN']
    delete process.env['INPUT_CLICKUP_CUSTOM_TASK_IDS']
    delete process.env['INPUT_CLICKUP_TEAM_ID']
    delete process.env['INPUT_TARGET_ASSIGNEES_USERNAMES']
    delete process.env['INPUT_CLICKUP_USER_ID_MAPPING_PATH']
})
