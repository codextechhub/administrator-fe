/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EllipsisVertical } from "lucide-react";

interface myComponentProps {
  tableHeaderList: string[];
  loading?: boolean;
  tableBodyList?: any;
  hidePagination?: boolean;
  onPageChange?: (param?: string | number) => void;
  currentPage?: number;
  totalPage?: number;
  perPage?: number;
  onRowClick?: (param?: any) => void;
  defaultBodyList?: any;
  actionButton?: string;
  actionButtonOnClick?: (param?: unknown) => void;
  dropDown?: boolean;
  dropDownList?: any;
  width?: string;
  disabledDropdown?: boolean;
  loadingText?: string;
  emptyText?: string;
}

const CustomTable = ({
  tableHeaderList,
  loading,
  actionButtonOnClick,
  actionButton,
  tableBodyList,
  onRowClick,
  defaultBodyList,
  dropDown,
  dropDownList,
  width,
  disabledDropdown,
  totalPage = 0,
  currentPage = 0,
  onPageChange,
  hidePagination,
  loadingText,
  emptyText,
}: myComponentProps) => {
  //   pagination here ------
  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    // Always show first page
    pageNumbers.push(1);

    // Calculate range of pages to show around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPage - 1, currentPage + 1);
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pageNumbers.push("ellipsis-start");
    }
    // Add pages in the calculated range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPage - 1) {
      pageNumbers.push("ellipsis-end");
    }
    // Always show last page if there is more than one page
    if (totalPage > 1) {
      pageNumbers.push(totalPage);
    }

    return pageNumbers;
  };

  const handlePickObjFromDefaultList = (param: any) => {
    if (defaultBodyList?.length > 0) {
      const obj = defaultBodyList?.find((_: any, idx: any) => idx === param);
      return obj;
    }
  };

  const TableRowComponet = ({
    row,
    children,
    onClick,
  }: {
    row: any;
    children: React.ReactNode;
    onClick: (val: any) => void;
  }) => (
    <TableRow
      className="transition-all duration-300 hover:bg-primary/5"
      key={row?.id}
    >
      {row?.map((cell: any, index: any) => (
        <TableCell
          className="text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5"
          key={index}
          onClick={onClick}
        >
          {cell}
        </TableCell>
      ))}
      {children}
    </TableRow>
  );

  return (
    <div className="w-full flex flex-col ">
      {/* table component start here ------ */}
      <Table>
        {tableHeaderList?.length > 0 && (
          <TableHeader className="border-0">
            <TableRow>
              {tableHeaderList?.map((chi, idx) => {
                return (
                  <TableHead
                    key={idx}
                    className={cn(
                      "text-gray-01 bg-[#F1F1F1] font-semibold font-mont text-xs lg:text-sm whitespace-nowrap capitalize pt-3 pb-2",
                      chi.toLowerCase() === "action" && " text-center",
                    )}
                  >
                    {chi || ""}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
        )}
        {/* body start here ------ */}

        <TableBody className="bg-white">
          {loading ? (
            <>
              <TableRow>
                <TableCell
                  colSpan={tableHeaderList?.length + 1}
                  className="h-60 text-center"
                >
                  <figure className="size-fit mx-auto">
                    <div className="loader" />
                  </figure>
                  {loadingText && <p className="mt-4">{loadingText}</p>}
                </TableCell>
              </TableRow>
            </>
          ) : (
            <>
              {tableBodyList?.length > 0 ? (
                <>
                  {tableBodyList?.map((item: any, rowIndex: any) => {
                    // to ignore some data that might be needed when accessing row object, table row: value Object.values(item) is changed to FORMATTED_DATA?.map((data) => Object.values(data))

                    //  if tableBodyList object has _slug key it will be ignored when rendering table data
                    const FORMATTED_DATA = Object?.entries(item)
                      .filter(([key]) => {
                        return key !== "_slug";
                      })
                      ?.map((d) => {
                        return {
                          [d[0]]: d[1],
                        };
                      });
                    return (
                      <TableRowComponet
                        key={rowIndex}
                        row={FORMATTED_DATA?.map(
                          (data) => Object.values(data)[0],
                        )}
                        onClick={() => {
                          if (onRowClick) {
                            if (defaultBodyList?.length > 0) {
                              onRowClick(
                                handlePickObjFromDefaultList(rowIndex),
                              );
                            } else {
                              onRowClick(item);
                            }
                          }
                        }}
                      >
                        {dropDown && (
                          <TableCell className="text-black-01 border-gray-03 font-medium font-mont text-sm border-y-5">
                            <div
                              style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%",
                              }}
                              className=""
                            >
                              {actionButton ? (
                                <button
                                  type="button"
                                  disabled={disabledDropdown}
                                  onClick={() => {
                                    if (actionButtonOnClick) {
                                      actionButtonOnClick(item);
                                    }
                                  }}
                                  className="w-13 h-6 rounded-xm border-[0.5px] border-black-02 text-black-02 font-medium text-xs cursor-pointer"
                                >
                                  {actionButton}
                                </button>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    className={cn(
                                      "cursor-pointer px-2",
                                      disabledDropdown && "cursor-not-allowed",
                                    )}
                                    disabled={disabledDropdown}
                                  >
                                    <EllipsisVertical className="size-8" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    className="border rounded-sm"
                                    align="end"
                                    style={{ width: width ? width : "170px" }}
                                  >
                                    {dropDownList?.length > 0 &&
                                      dropDownList?.map(
                                        (child: any, idx: any) => {
                                          return (
                                            <DropdownMenuItem
                                              key={idx}
                                              onClick={() => {
                                                if (child?.onActionClick) {
                                                  child.onActionClick(item);
                                                }
                                              }}
                                              className={cn(
                                                "font-light text-sm cursor-pointer text-custom-gray-scale-400",
                                                child?.className,
                                              )}
                                            >
                                              {child?.label}
                                            </DropdownMenuItem>
                                          );
                                        },
                                      )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRowComponet>
                    );
                  })}
                </>
              ) : (
                <>
                  <TableRow>
                    <TableCell
                      colSpan={tableHeaderList?.length + 1}
                      className="h-56 text-center hover:bg-transparent"
                    >
                      <div className="size-40 mx-auto rounded-full border border-primary grid place-content-center">
                        <p className="text-xs text-gray-01">
                          {emptyText ? emptyText : "No available data."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </>
          )}
        </TableBody>
        {/* body end here ------------------ */}
      </Table>
      {/* table component end here ------ */}
      {/* pagination start here ------ */}
      {totalPage >= 2 && !hidePagination && (
        <div className="inline-flex items-center gap-2 ml-auto mt-3.5">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <div key={`ellipsis-${index}`} className="px-2 text-black-02">
                  ...
                </div>
              );
            }

            const isActive = currentPage === page;

            return (
              <button
                key={`page-${page}`}
                onClick={() => {
                  {
                    if (onPageChange) onPageChange(page as number);
                  }
                }}
                className={cn(
                  "grid size-7.5 place-content-center rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-transparent text-black-02 hover:bg-gray-100",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomTable;
