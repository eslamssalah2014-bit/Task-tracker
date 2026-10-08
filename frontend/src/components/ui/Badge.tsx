import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'urgent' | 'neutral' | 'purple' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    urgent: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const TaskHealthBadge: React.FC<{ health?: string; score?: number }> = ({ health = 'Healthy', score }) => {
  const getVariant = () => {
    switch (health) {
      case 'Healthy':
        return 'success';
      case 'At Risk':
        return 'warning';
      case 'Critical':
        return 'danger';
      case 'Blocked':
        return 'urgent';
      case 'Completed':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <Badge variant={getVariant()}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{health}</span>
      {score !== undefined && <span className="text-[10px] opacity-75 font-mono">({score})</span>}
    </Badge>
  );
};

export const PriorityBadge: React.FC<{ priority?: string }> = ({ priority = 'Medium' }) => {
  const getVariant = () => {
    switch (priority) {
      case 'Low':
        return 'neutral';
      case 'Medium':
        return 'primary';
      case 'High':
        return 'warning';
      case 'Urgent':
        return 'urgent';
      case 'Critical':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <Badge variant={getVariant()} size="sm">
      {priority}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status = 'Not Started' }) => {
  const getVariant = () => {
    switch (status) {
      case 'Not Started':
        return 'neutral';
      case 'In Progress':
        return 'primary';
      case 'Waiting':
        return 'warning';
      case 'Blocked':
        return 'danger';
      case 'Under Review':
        return 'purple';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <Badge variant={getVariant()} size="sm">
      {status}
    </Badge>
  );
};
