import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Info, RefreshCw, Download, LayoutGrid, Calendar, ChevronDown, FileText } from "lucide-react";
import AddTicketModal from "@/components/AddTicketModal";

export default function Draft() {
  const [activeTab, setActiveTab] = useState("assigned");
  const [activeStatus, setActiveStatus] = useState("Total");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const tabs = [
    { id: "assigned", label: "Assigned to me" },
    { id: "created", label: "Created by me" },
    { id: "closure", label: "Closure Assigned" },
  ];

  const statusFilters = [
    "Total", "Open", "In Progress", "On Hold", "Completed", "Closed", "Rejected", "Overdue", "On Time", "Due Today"
  ];

  const statusCounts: Record<string, number> = {
    "Total": 0,
    "Open": 0,
    "In Progress": 0,
    "On Hold": 0,
    "Completed": 0,
    "Closed": 0,
    "Rejected": 0,
    "Overdue": 0,
    "On Time": 0,
    "Due Today": 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Dashboard</h1>
          <p className="text-gray-500 mt-1">Track and manage all your task tickets in one place.</p>
        </div>
        <Button 
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setIsTicketModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </motion.div>

      {/* Last Updated */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-2 text-sm text-gray-500"
      >
        <span>Last Updated At: 07:20 PM</span>
        <RefreshCw className="w-4 h-4 cursor-pointer hover:text-gray-700" />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-orange-500 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Search and Date Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-4 items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Tickets..."
                className="pl-10 border-gray-300 focus:border-orange-500"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search tickets by keyword</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-5 h-5 text-gray-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Search help and tips</p>
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                type="text"
                value="10-03-2026"
                className="w-32 border-gray-300 focus:border-orange-500"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Start date</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-gray-500">to</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  type="text"
                  value="10-06-2026"
                  className="w-32 border-gray-300 pr-8 focus:border-orange-500"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>End date</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Apply
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apply date filter</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Status Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap gap-2 items-center"
      >
        {statusFilters.map((status) => (
          <Tooltip key={status}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveStatus(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeStatus === status
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{status} Tickets : {statusCounts[status]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 border-gray-300">
              Active
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>All</DropdownMenuItem>
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Inactive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-3 items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="border-gray-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              Load More
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load more tickets</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export tickets data</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem>Export as Excel</DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="border-gray-300">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change view layout</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <FileText className="w-12 h-12 text-gray-400" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-gray-500 text-lg"
        >
          No Tickets available for this date range. Try selecting a different date range :)
        </motion.p>
      </motion.div>

      <AddTicketModal
        open={isTicketModalOpen}
        onOpenChange={setIsTicketModalOpen}
        onCreateTicket={(data) => {
          console.log("Creating ticket:", data);
          // Handle ticket creation logic here
        }}
      />
    </div>
  );
}
