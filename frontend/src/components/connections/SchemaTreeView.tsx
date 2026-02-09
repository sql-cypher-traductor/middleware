"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Database, Table2, Columns } from "lucide-react";
import type { DatabaseSchema, TableSchema, TableColumn } from "@/types/connection";

interface SchemaTreeViewProps {
  schema: DatabaseSchema;
  isLoading?: boolean;
}


function TableColumnNode({ column }: { column: TableColumn }) {
  const typeLabel = column.character_maximum_length
    ? `${column.data_type}(${column.character_maximum_length})`
    : column.data_type;

  return (
    <div className="column-node">
      <span className="column-icon">
        <Columns size={12} />
      </span>
      <span className="column-name">{column.column_name}</span>
      <span className="column-type">{typeLabel}</span>
      {column.is_nullable && <span className="nullable">NULL</span>}

      <style jsx>{`
        .column-node {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem 0.25rem 1.75rem;
          font-size: var(--text-caption);
        }

        .column-icon {
          display: flex;
          color: var(--text-muted);
        }

        .column-name {
          color: var(--text-primary);
          font-family: monospace;
        }

        .column-type {
          color: var(--text-muted);
          font-family: monospace;
          font-size: 0.65rem;
        }

        .nullable {
          padding: 0.125rem 0.25rem;
          background-color: var(--bg-tertiary);
          color: var(--text-muted);
          border-radius: 0.25rem;
          font-size: 0.6rem;
          font-weight: var(--font-medium);
        }
      `}</style>
    </div>
  );
}

function TableNode({ table }: { table: TableSchema }) {
  const [isOpen, setIsOpen] = useState(false);
  const fullName = table.table_schema !== "dbo"
    ? `${table.table_schema}.${table.table_name}`
    : table.table_name;

  return (
    <div className="table-node">
      <button
        className="table-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="chevron">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="table-icon">
          <Table2 size={14} />
        </span>
        <span className="table-name">{fullName}</span>
        <span className="column-count">{table.columns.length}</span>
      </button>
      {isOpen && (
        <div className="table-columns">
          {table.columns.map((column) => (
            <TableColumnNode key={column.column_name} column={column} />
          ))}
        </div>
      )}

      <style jsx>{`
        .table-node {
          margin-left: 1rem;
        }

        .table-header {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.5rem;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 0.375rem;
          transition: background-color 0.15s ease;
          font-size: var(--text-caption);
        }

        .table-header:hover {
          background-color: var(--bg-tertiary);
        }

        .chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          width: 14px;
        }

        .table-icon {
          display: flex;
          align-items: center;
          color: var(--accent-primary);
        }

        .table-name {
          flex: 1;
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .column-count {
          padding: 0.125rem 0.375rem;
          background-color: var(--bg-tertiary);
          color: var(--text-muted);
          border-radius: 9999px;
          font-size: var(--text-caption);
        }

        .table-columns {
          border-left: 1px solid var(--border-primary);
          margin-left: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export function SchemaTreeView({ schema, isLoading }: SchemaTreeViewProps) {
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="schema-loading">
        <div className="loading-skeleton">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
        <style jsx>{`
          .schema-loading {
            padding: 0.5rem;
          }
          .loading-skeleton {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .skeleton-line {
            height: 1.25rem;
            background: linear-gradient(
              90deg,
              var(--bg-tertiary) 25%,
              var(--border-primary) 50%,
              var(--bg-tertiary) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 0.25rem;
          }
          .skeleton-line.short {
            width: 60%;
            margin-left: 1rem;
          }
          .skeleton-line.medium {
            width: 80%;
            margin-left: 1rem;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (!schema || schema.tables.length === 0) {
    return (
      <div className="schema-empty">
        <p>No se encontraron tablas</p>
        <style jsx>{`
          .schema-empty {
            padding: 1rem;
            text-align: center;
            color: var(--text-muted);
            font-size: var(--text-label);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="schema-tree">
      <button
        className="database-header"
        onClick={() => setIsDatabaseOpen(!isDatabaseOpen)}
        type="button"
      >
        <span className="chevron">
          {isDatabaseOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="db-icon">
          <Database size={16} />
        </span>
        <span className="db-name">{schema.database_name}</span>
        <span className="table-count">{schema.tables.length} tablas</span>
      </button>

      {isDatabaseOpen && (
        <div className="tables-container">
          {schema.tables.map((table) => (
            <TableNode
              key={`${table.table_schema}.${table.table_name}`}
              table={table}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .schema-tree {
          padding: 0.5rem;
          overflow-y: auto;
          max-height: 100%;
        }

        .database-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 0.5rem;
          transition: background-color 0.15s ease;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
        }

        .database-header:hover {
          background-color: var(--bg-tertiary);
        }

        .chevron {
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }

        .db-icon {
          display: flex;
          align-items: center;
          color: var(--blue-700);
        }

        .db-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table-count {
          padding: 0.125rem 0.5rem;
          background-color: var(--bg-tertiary);
          color: var(--text-muted);
          border-radius: 9999px;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
        }

        .tables-container {
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}

export default SchemaTreeView;

