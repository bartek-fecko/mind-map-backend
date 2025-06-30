export const NotesSocketEvents = {
  GET_ALL: 'notes:get-all',
  ADD: 'notes:add',
  REMOVE: 'notes:remove',
  REMOVE_ALL: 'notes:remove-all',
  UPDATE: 'notes:update',
  INCREASE_Z_INDEX: 'notes:increase-z-index',
  DECREASE_Z_INDEX: 'notes:decrease-z-index',
} as const;
