from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.repositories.col_repository import ColumnRepository
from app.repositories.task_repository import TaskRepository

class TaskService:
    def __init__(
        self,
        task_repository: TaskRepository,
        column_repository: ColumnRepository,
    ):
        self.task_repository = task_repository
        self.column_repository = column_repository

    async def _check_column_access(
        self, board_id: UUID, column_id: UUID, user_id: UUID
    ) -> None:
        column = await self.column_repository.find_column(
            board_id, column_id, user_id
        )
        if not column:
            raise BoardNotFoundException("Board or column not found")

    async def create_task(self, board_id: UUID, column_id: UUID, user_id: UUID, payload):
        await self._check_column_access(board_id, column_id, user_id)

        task = await self.task_repository.create_task(
            board_id=board_id,
            column_id=column_id,
            title=payload.title,
            description=payload.description,
            due_date=payload.due_date,
            created_by=user_id,
        )
        if not task:
            raise BoardNotFoundException("Board or column not found")
        return task

    async def get_many_tasks(
        self, board_id: UUID, column_id: UUID, user_id: UUID
    ):
        await self._check_column_access(board_id, column_id, user_id)
        return await self.task_repository.find_many_tasks(board_id, column_id)

    async def get_task(
        self, board_id: UUID, column_id: UUID, task_id: UUID, user_id: UUID
    ):
        await self._check_column_access(board_id, column_id, user_id)
        task = await self.task_repository.find_task(board_id, column_id, task_id)
        if not task:
            raise BoardNotFoundException("Task not found")
        return task

    async def update_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        user_id: UUID,
        payload,
    ):
        await self._check_column_access(board_id, column_id, user_id)
        values = payload.model_dump(exclude_unset=True, by_alias=False)

        task = await self.task_repository.update_task(
            board_id, column_id, task_id, values
        )
        if not task:
            raise BoardNotFoundException("Task not found")
        return task

    async def delete_task(
        self, board_id: UUID, column_id: UUID, task_id: UUID, user_id: UUID
    ) -> None:
        await self._check_column_access(board_id, column_id, user_id)
        deleted = await self.task_repository.delete_task(board_id, column_id, task_id)
        if not deleted:
            raise BoardNotFoundException("Task not found")

    async def assign_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        user_id: UUID,
        assignee_id: UUID,
    ):
        await self._check_column_access(board_id, column_id, user_id)
        if not await self.column_repository.is_member(board_id, assignee_id):
            raise BoardNotFoundException(
                "Assignee is not a member of this board"
            )

        assignee = await self.task_repository.assign_task(
            board_id, column_id, task_id, assignee_id, user_id
        )
        if not assignee:
            raise BoardNotFoundException("Task or assignee not found")
        return assignee

    async def get_task_assignees(
        self, board_id: UUID, column_id: UUID, task_id: UUID, user_id: UUID
    ):
        await self._check_column_access(board_id, column_id, user_id)
        assignees = await self.task_repository.find_task_assignees(
            board_id, column_id, task_id
        )
        if not assignees:
            return assignees

        assigner = await self.task_repository.find_task_assigner(
            board_id, column_id, task_id
        )
        if assigner:
            assignees[0].update(
                assigned_by=assigner["id"],
                assigned_by_name=assigner["name"],
                assigned_by_email=assigner["email"],
            )
        return assignees

    async def unassign_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        user_id: UUID,
        assignee_id: UUID,
    ) -> None:
        await self._check_column_access(board_id, column_id, user_id)
        deleted = await self.task_repository.unassign_task(
            board_id, column_id, task_id, assignee_id
        )
        if not deleted:
            raise BoardNotFoundException("Task or assignee not found")
