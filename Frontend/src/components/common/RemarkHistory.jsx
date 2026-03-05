import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaskRemarks } from "../../store/actions/employeeTaskActions";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import {
  RiCalendarLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiFileTextLine,
  RiTimeLine,
  RiUser3Line,
} from "@remixicon/react";

/**
 * RemarkHistory — filterable EOD remark history for a task.
 * Used in both the admin TaskEditor (EOD History tab) and the employee
 * EmployeeDashboard task detail panel.
 *
 * Props:
 *   taskId   — string, required
 *   role     — "admin" | "employee"
 *   employees — array of { id, firstName, lastName } (admin only for filter dropdown)
 */
const RemarkHistory = ({ taskId, role = "employee", employees = [] }) => {
  const dispatch = useDispatch();

  // Filter state
  const [filterMode, setFilterMode] = useState("none"); // "none" | "day" | "month" | "range"
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterUser, setFilterUser] = useState("all");

  // Data state
  const [remarks, setRemarks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const buildFilters = useCallback(() => {
    const f = { page, limit: 20 };
    if (filterMode === "day" && filterDate) f.date = filterDate;
    else if (filterMode === "month" && filterMonth) f.month = filterMonth;
    else if (filterMode === "range") {
      if (filterStart) f.startDate = filterStart;
      if (filterEnd) f.endDate = filterEnd;
    }
    if (role === "admin" && filterUser !== "all") f.userId = filterUser;
    return f;
  }, [filterMode, filterDate, filterMonth, filterStart, filterEnd, filterUser, page, role]);

  const loadRemarks = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const result = await dispatch(fetchTaskRemarks(taskId, buildFilters()));
      setRemarks(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      setRemarks([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, dispatch, buildFilters]);

  useEffect(() => { setPage(1); }, [filterMode, filterDate, filterMonth, filterStart, filterEnd, filterUser]);
  useEffect(() => { loadRemarks(); }, [loadRemarks]);

  const clearFilters = () => {
    setFilterMode("none");
    setFilterDate("");
    setFilterMonth("");
    setFilterStart("");
    setFilterEnd("");
    setFilterUser("all");
    setPage(1);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter Bar ───────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-start bg-muted/20 border border-border/40 rounded-lg p-3">
        {/* Filter mode selector */}
        <Select value={filterMode} onValueChange={setFilterMode}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Dates</SelectItem>
            <SelectItem value="day">Specific Day</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="range">Date Range</SelectItem>
          </SelectContent>
        </Select>

        {/* Day picker */}
        {filterMode === "day" && (
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-8 text-xs px-2 rounded-md border border-border bg-background text-foreground"
          />
        )}

        {/* Month picker */}
        {filterMode === "month" && (
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="h-8 text-xs px-2 rounded-md border border-border bg-background text-foreground"
          />
        )}

        {/* Range picker */}
        {filterMode === "range" && (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-border bg-background text-foreground"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-border bg-background text-foreground"
            />
          </div>
        )}

        {/* Employee filter (admin only) */}
        {role === "admin" && employees.length > 0 && (
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.firstName || emp.fullName?.firstName} {emp.lastName || emp.fullName?.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear */}
        {(filterMode !== "none" || filterUser !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            Clear
          </Button>
        )}

        {/* Summary badge */}
        <div className="ml-auto flex items-center">
          <Badge variant="outline" className="text-[10px] h-6">
            {pagination.total} {pagination.total === 1 ? "entry" : "entries"}
          </Badge>
        </div>
      </div>

      {/* ── Remark Cards ─────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <RiTimeLine className="animate-spin mr-2" size={16} /> Loading...
        </div>
      ) : remarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <RiFileTextLine size={32} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No EOD remarks found</p>
          <p className="text-xs text-muted-foreground/60">
            {filterMode !== "none" ? "Try changing your filters." : "Remarks will appear here once submitted."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {remarks.map((r) => (
            <Card key={r.id} className="p-4 border-border/40 hover:border-primary/20 transition-colors">
              <div className="flex flex-col gap-2">
                {/* Date / meta row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <RiCalendarLine size={13} className="text-primary" />
                    {formatDate(r.date)}
                  </div>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">
                    Last edited {formatTime(r.updatedAt)}
                  </span>
                  {role === "admin" && r.submittedBy && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <RiUser3Line size={12} />
                        {r.submittedBy.firstName} {r.submittedBy.lastName}
                      </div>
                    </>
                  )}
                </div>

                {/* Remark body */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-primary/30 pl-3">
                  {r.remark || <span className="text-muted-foreground italic">No remark text.</span>}
                </p>

                {/* Completion note */}
                {r.completionNote && (
                  <div className="mt-1 bg-muted/30 rounded-md px-3 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Completion Note</p>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.completionNote}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
            <span className="font-medium text-foreground">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <RiArrowLeftLine size={13} />
            </Button>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              <RiArrowRightLine size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemarkHistory;
