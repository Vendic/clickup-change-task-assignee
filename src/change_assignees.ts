import * as core from '@actions/core'
import * as fs from "fs";
import {addAssignees, removeAssignees} from './api_calls'

export default async function change_assignees(): Promise<void> {
    try {
        let failed: boolean = false;
        const token: string = core.getInput('clickup_token')
        const task_ids: string[] = core.getMultilineInput('clickup_custom_task_ids')
        const team_id: string = core.getInput('clickup_team_id')
        let target_assignees_usernames: any = core.getMultilineInput('target_assignees_usernames');
        if (typeof target_assignees_usernames === 'string') {
            target_assignees_usernames = target_assignees_usernames.split(',') as string[];
        }

        core.info(`Target assignees:`)
        core.info(target_assignees_usernames.join(','));

        const mapping_path: string = core.getInput('clickup_user_id_mapping_path')
        const mapping_json: string = fs.readFileSync(mapping_path, 'utf-8')
        const mapping: any = JSON.parse(mapping_json)
        const target_assignees: number[] = getTargetAssignees(target_assignees_usernames, mapping)
        const add_assignees : boolean = core.getBooleanInput('add_assignees')

        for (const task_id of task_ids) {
            try {
                if (add_assignees) {
                    await addAssignees(task_id, team_id, token, target_assignees)
                } else {
                    await removeAssignees(task_id, team_id, token, target_assignees)
                }
            } catch (error) {
                failed = true
                // @ts-ignore
                core.info(`${task_id} error: ${error.message}`)
                core.debug(`Error output for ${task_id}`)
                core.debug(JSON.stringify(error))
            }
        }

        if (failed) {
            throw 'One of the API requests has failed. Please check the logs for more details.'
        }

    } catch (error) {
        core.setFailed(`Action failed: ${error}`)
    }
}

function getTargetAssignees(target_assignees_usernames: string[], clickup_user_id_mapping: any): number[] {
    const target_assignees = target_assignees_usernames.map(
        username => clickup_user_id_mapping[username.toString()]
    ).filter(id => id !== undefined);
    // Force return as ints, the Clickup API expects integers only.
    return target_assignees.map((target_assignee) => {
        return parseInt(target_assignee)
    })
}
