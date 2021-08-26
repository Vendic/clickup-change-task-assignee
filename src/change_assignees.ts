import * as core from '@actions/core'
import axios from 'axios'
import * as fs from "fs";

function getTargetAssignees(target_assignees_usernames: string[], clickup_user_id_mapping: any) : number[] {
    const target_assignees = target_assignees_usernames.map(
        username => clickup_user_id_mapping[username.toString()]
    ).filter(id => id !== undefined);
    // Force return as ints, the Clickup API expects integers only.
    return target_assignees.map((target_assignee) => {
        return parseInt(target_assignee)
    })
}

export default async function change_assignees(): Promise<void> {
    try {
        let failed: boolean = false;
        const token: string = core.getInput('clickup_token')
        const task_ids : string[] = core.getMultilineInput('clickup_custom_task_ids')
        const team_id : string = core.getInput('clickup_team_id')
        const target_assignees_usernames : string[] = core.getMultilineInput('target_assignees_usernames')
        const mapping_path : string = core.getInput('clickup_user_id_mapping_path')
        const mapping_json : string = fs.readFileSync(mapping_path, 'utf-8')
        const mapping : any = JSON.parse(mapping_json)
        const target_assignees: number[] = getTargetAssignees(target_assignees_usernames, mapping)

        for (const task_id of task_ids) {
            let endpoint = `https://api.clickup.com/api/v2/task/${task_id}/?custom_task_ids=true&team_id=${team_id}`
            let result = await axios.get(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            })

            core.debug(`GET request for ${task_id} output:`)
            core.debug(JSON.stringify(result.data))

            let current_assignees : number[] = result.data.assignees.map((elem: { id: number; }) => (elem.id)) ?? []
            let remove_assignees : number[] = current_assignees.filter(x => !target_assignees.includes(x)) ?? []
            let add_assignees : number[] = target_assignees.filter(x => !current_assignees.includes(x)) ?? []

            core.debug(`Current assignees: ${current_assignees.join(',')}`)
            core.debug(`Remove assignees: ${remove_assignees.join(',')}`)
            core.debug(`Add assignees: ${add_assignees.join(',')}`)

            let body = {
                "assignees": {
                    "add": [
                        ...add_assignees
                    ],
                    "rem": [
                        ...remove_assignees
                    ]
                }
            }

            core.debug(`Put request for ${task_id}:`)
            core.debug(JSON.stringify(body))

            await axios.put(endpoint, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            }).then(
                (result) => {
                    result.data.assignees.forEach((assignee : any) => core.info(`${task_id} assigned to ${assignee.username}`))
                    core.debug('Put request response:')
                    core.debug(JSON.stringify(result.data))
                }
            ).catch(
                function (error) {
                    failed = true
                    core.info(`${task_id} error: ${error.message}`)
                    core.debug(`Error output for ${task_id}`)
                    core.debug(JSON.stringify(error))
                }
            )
        }


        if (failed) {
            throw 'One of the API requests has failed. Please check the logs for more details.'
        }

    } catch (error) {
        core.setFailed(`Action failed: ${error}`)
    }
}
