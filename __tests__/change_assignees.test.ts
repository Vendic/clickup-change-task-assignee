import * as core from '@actions/core'
import * as fs from "fs";
import nock from "nock";
import {expect, test} from '@jest/globals'
import change_assignees from '../src/change_assignees'

/**
 * The default mode does an API request to Clickup first, to GET the current assignees. Then it compares the current
 * assignees with the target assignees.
 */
test('Default mode, assigns the task to Bar and Baz, removes user Foo', async () => {
    // Settings
    process.env['INPUT_ADD_ASSIGNEES_MODE'] = 'true'

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

    await change_assignees()

    // Assertions
    const body = {
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

/**
 * The add assignee mode is set to false here, we won't compare the current users, we will just send an API request
 * to Clickup that removes specified users.
 */
test('Remove mode, unassigns the users Baz and Bar, keeps Foo', async () => {
    // Settings
    process.env['INPUT_ADD_ASSIGNEES_MODE'] = 'false'

    const debugMock = jest.spyOn(core, 'debug')
    const failedMock = jest.spyOn(core, 'setFailed')
    const body = {
        "assignees": {
            "add": [],
            "rem": [
                2,
                3
            ]
        }
    }

    await change_assignees()

    expect(debugMock).toHaveBeenCalledWith(JSON.stringify(body))
    expect(failedMock).toHaveBeenCalledTimes(0)
})

beforeEach(() => {
    process.env['INPUT_CLICKUP_TOKEN'] = 'pk_123'
    process.env['INPUT_CLICKUP_CUSTOM_TASK_IDS'] = 'MAX-185'
    process.env['INPUT_CLICKUP_TEAM_ID'] = '123'
    process.env['INPUT_TARGET_ASSIGNEES_USERNAMES'] = 'bar\nbaz\nsome-random-user'
    process.env['INPUT_CLICKUP_USER_ID_MAPPING_PATH'] = __dirname + '/' + 'user_mapping.json'
})
