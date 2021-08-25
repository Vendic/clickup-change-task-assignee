import * as core from '@actions/core'
import axios from 'axios'

function getTargetAssignees(target_assignees_usernames: string[], clickup_user_id_mapping: any) {
    return target_assignees_usernames.map(
        username => clickup_user_id_mapping[username.toString()]
    ).filter(id => id !== undefined);
}

const run = async (): Promise<void> => {
    try {
        let failed: boolean = false;
        const token : string = core.getInput('clickup_token')
        const task_ids : string[] = core.getMultilineInput('clickup_custom_task_ids')
        const team_id : string = core.getInput('clickup_team_id')
        const target_assignees_usernames : string[] = core.getMultilineInput('target_assignees_usernames')
        const clickup_user_id_mapping : any = JSON.parse(core.getInput('clickup_user_id_mapping'))
        const target_assignees: number[] = getTargetAssignees(target_assignees_usernames, clickup_user_id_mapping)

        for (const task_id of task_ids) {
            let endpoint = `https://api.clickup.com/api/v2/task/${task_id}/?custom_task_ids=true&team_id=${team_id}`
            let result = await axios.get(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            })

            let current_assignees : number[] = result.data.assignees.map((elem: { id: number; }) => (elem.id)) ?? []
            let remove_assignees : number[] = current_assignees.filter(x => !target_assignees.includes(x)) ?? []
            let add_assignees : number[] = target_assignees.filter(x => !current_assignees.includes(x)) ?? []

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
            core.debug(JSON.stringify(body))

            await axios.put(endpoint, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            }).then(
                (result) => {
                    result.data.assignees.forEach((assignee : any) => core.info(`${task_id} assigned to ${assignee.username}`))
                }
            ).catch(
                function (error) {
                    failed = true
                    core.info(`${task_id} error: ${error.message}`)
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

run()

export default run
