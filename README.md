# Clickup change status action [![Tests](https://github.com/Vendic/clickup-change-task-assignee/actions/workflows/tests.yml/badge.svg)](https://github.com/Vendic/clickup-change-task-assignee/actions/workflows/tests.yml)
Github action to automatically change the status of task in Clickup

### Setup
First we have to know which Github user responds to which Clickup user. We can find that out by doing a call to the Clickup API:
```bash
curl --location --request GET 'https://api.clickup.com/api/v2/team' \
--header 'Authorization: pk_123' \
--header 'Content-Type: application/json'
```
This will give you the user id's of yout eam:

```
{
    "teams": [
        {
            "id": "123",
            "name": "Vendic",
            "color": "#40BC86",
            "avatar": null,
            "members": [
                {
                    "user": {
                        "id": 1,
                        "username": "Foobar",
```

Put the id's in a JSON file, for example `mapping.json` and commit it to your repository:

```json
{
    "foobar": 1 // Where foobar is your github user, 1 is the clickup ID
}
```

### Usage
```yml
            -   name: Get clickup team ID
                env:
                    clickup_token: ${{ secrets.CLICKUP_TOKEN }}
                run: |
                    TEAM_ID=$(curl --location --request GET 'https://api.clickup.com/api/v2/team' --header "Authorization: $clickup_token" --header 'Content-Type: application/json' | jq -r "(.teams | first).id")
                    echo "TEAM_ID=${TEAM_ID}" >> $GITHUB_ENV

            -   name: Assign clickup users
                uses: Vendic/clickup-change-task-assignee@master
                with:
                    clickup_token: ${{ secrets.CLICKUP_TOKEN }}
                    clickup_custom_task_ids: |
                        MAX-185
                    clickup_team_id: ${{ env.TEAM_ID }}
                    target_assignees_usernames: |
                        Tjitse-E
                    clickup_user_id_mapping_path: mapping.json
```

The result will be that the task with id MAX-185 is added to Tjitse-E only, the original assignees are removed (if there were any to begin with).
