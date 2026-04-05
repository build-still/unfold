import * as React from 'react';

export type EmptyListProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export const EmptyList = ({
  title = 'Nothing here yet',
  description,
  action,
}: EmptyListProps) => (
  <div className="empty-list">
    <p>{title}</p>
    {description && <p>{description}</p>}
    {action}
  </div>
);
