import axios from "axios";
import * as core from "@actions/core";

export async function addAssignees(
    task_id: string,
    team_id: string,
    token: string,
    target_assignees: number[],
): Promise<void> {
    let endpoint = `https://api.clickup.com/api/v2/task/${task_id}/?custom_task_ids=true&team_id=${team_id}`
    let result = await axios.get(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })

    core.debug(`GET request for ${task_id} output:`)
    core.debug(JSON.stringify(result.data))

    let current_assignees: number[] = result.data.assignees.map((elem: { id: number; }) => (elem.id)) ?? []
    let remove_assignees: number[] = current_assignees.filter(x => !target_assignees.includes(x)) ?? []
    let add_assignees: number[] = target_assignees.filter(x => !current_assignees.includes(x)) ?? []

    core.debug(`Current assignees: ${current_assignees.join(',')}`)
    core.debug(`Remove assignees: ${remove_assignees.join(',')}`)
    core.debug(`Add assignees: ${add_assignees.join(',')}`)

    const body = {
        "assignees": {
            "add": [
                ...add_assignees
            ],
            "rem": [
                ...remove_assignees
            ]
        }
    }
    await put(task_id, body, endpoint, token);
}

export async function removeAssignees(
    task_id: string,
    team_id: string,
    token: string,
    target_assignees: number[],
): Promise<void> {
    const endpoint = `https://api.clickup.com/api/v2/task/${task_id}/?custom_task_ids=true&team_id=${team_id}`
    const body = {
        "assignees": {
            "add": [],
            "rem": [
                ...target_assignees
            ]
        }
    }
    await put(task_id, body, endpoint, token);
}

async function put(
    task_id: string,
    body: { assignees: { add: number[]; rem: number[] } },
    endpoint: string,
    token: string
) {
    core.debug(`Put request for ${task_id}:`)
    core.debug(JSON.stringify(body))

    await axios.put(endpoint, body, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    }).then(
        (result) => {
            result.data.assignees.forEach((assignee: any) => core.info(`${task_id} assigned to ${assignee.username}`))
            core.debug('Put request response:')
            core.debug(JSON.stringify(result.data))
        }
    )
}
