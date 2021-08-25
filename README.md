# Clickup change status action [![Tests](https://github.com/Tjitse-E/clickup-change-status/actions/workflows/tests.yml/badge.svg)](https://github.com/Tjitse-E/clickup-change-status/actions/workflows/tests.yml)
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

name: Assign clickup user
uses: Vendic/clickup-change-task-assignee@master
with:
  clickup_token: pk_123
  clickup_custom_task_ids: |
      ABC-123
      ABC-124
      ABC-125
  clickup_team_id: 123
  target_assignees_usernames: |
      Tjitse-E
      Foo
      Bar
  clickup_user_id_mapping: '{"foo": 1, "bar": 2, "baz": 3}'
```
