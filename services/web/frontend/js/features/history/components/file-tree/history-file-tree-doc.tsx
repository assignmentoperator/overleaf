import { memo } from 'react'
import classNames from 'classnames'
import HistoryFileTreeItem from './history-file-tree-item'
import iconTypeFromName from '../../../file-tree/util/icon-type-from-name'
import type { FileDiff } from '../../services/types/file'
import MaterialIcon from '@/shared/components/material-icon'

type HistoryFileTreeDocProps = {
  file: FileDiff
  name: string
  selected: boolean
  onClick: (file: FileDiff, event: React.MouseEvent<HTMLLIElement>) => void
  onKeyDown: (file: FileDiff, event: React.KeyboardEvent<HTMLLIElement>) => void
}

function HistoryFileTreeDoc({
  file,
  name,
  selected,
  onClick,
  onKeyDown,
}: HistoryFileTreeDocProps) {
  return (
    <li
      role="treeitem"
      className={classNames({ selected })}
      onClick={e => onClick(file, e)}
      onKeyDown={e => onKeyDown(file, e)}
      aria-selected={selected}
      aria-label={name}
      tabIndex={0}
    >
      <HistoryFileTreeItem
        name={name}
        operation={'operation' in file ? file.operation : undefined}
        icons={
          <MaterialIcon
            type={iconTypeFromName(name)}
            className="file-tree-icon"
          />
        }
      />
    </li>
  )
}

export default memo(HistoryFileTreeDoc)
