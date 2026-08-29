import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import CustomTable from "@/components/custom/custom-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";

const tableHeader = ["Full Name", "Admission No.", "Class", "Status", "Action"];

export default function Students() {
  return (
    <PageShell className="px-4.5 py-6 space-y-5">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div className="h-25.5 bg-white rounded-md w-full" key={idx} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 gap-5">
        <CustomInput
          id="search"
          canSearch
          placeholder="Search..."
          className="h-10"
          containerClass="max-w-[280px]"
        />

        <div className="inline-flex items-center gap-3.5">
          <Button
            variant={"white"}
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
          >
            {svgIcons.filterIcon} Filter
          </Button>
          <Button
            variant={"white"}
            size="lg"
            className="[&_svg]:size-5 font-medium font-mont"
          >
            {svgIcons.exportIcon} Export
          </Button>
        </div>
      </div>

      <CustomTable
        tableHeaderList={tableHeader}
        tableBodyList={FORMAT_TABLE_DATA(dummyData?.students)}
        dropDown
        dropDownList={[
          {
            label: "View Details",
            className: "",
            onActionClick: () => {},
          },
          {
            label: "Edit",
            className: "",
            onActionClick: () => {},
          },
        ]}
        perPage={10}
        totalPage={5}
        currentPage={1}
      />
    </PageShell>
  );
}

const FORMAT_TABLE_DATA = (data: any) => {
  return data?.map((item: any) => ({
    name: (
      <p className="capitalize inline-flex items-center">
        <Avatar className="mr-2">
          <AvatarImage src={"/image/avatar2.png"} />
          <AvatarFallback className="bg-pry-01 text-primary">
            {getInitials(item?.fullName)}
          </AvatarFallback>
        </Avatar>
        {item?.fullName || "---"}
      </p>
    ),
    admission: item?.admissionNumber || "---",
    class: item?.class || "---",
    status: (
      <Badge
        variant={item.status?.toLowerCase() === "active" ? "active" : "red"}
        className="w-fit min-w-22.5"
      >
        {item?.status || "---"}
      </Badge>
    ),
    _slug: item?.id,
  }));
};

const dummyData = {
  students: [
    {
      id: "stu_001",
      firstName: "Amaka",
      lastName: "Adeyemi",
      fullName: "Amaka Adeyemi",
      initials: "AA",
      admissionNumber: "GFA/2024/001",
      class: "JSS 2",
      branch: {
        name: "Secondary - Ikeja",
        type: "Secondary",
        location: "Ikeja",
      },
      status: "Active",
    },
    {
      id: "stu_002",
      firstName: "Chidi",
      lastName: "Balogun",
      fullName: "Chidi Balogun",
      initials: "CB",
      admissionNumber: "GFA/2024/002",
      class: "Primary 5",
      branch: {
        name: "Primary - Ikeja",
        type: "Primary",
        location: "Ikeja",
      },
      status: "Active",
    },
    {
      id: "stu_003",
      firstName: "Emeka",
      lastName: "Onu",
      fullName: "Emeka Onu",
      initials: "EO",
      admissionNumber: "GFA/2024/003",
      class: "SS 1",
      branch: {
        name: "Secondary - Ikeja",
        type: "Secondary",
        location: "Ikeja",
      },
      status: "Active",
    },
    {
      id: "stu_004",
      firstName: "Fatima",
      lastName: "Ibrahim",
      fullName: "Fatima Ibrahim",
      initials: "FI",
      admissionNumber: "GFA/2024/004",
      class: "Primary 3",
      branch: {
        name: "Primary - Lekki",
        type: "Primary",
        location: "Lekki",
      },
      status: "Active",
    },
    {
      id: "stu_005",
      firstName: "Kemi",
      lastName: "Nwosu",
      fullName: "Kemi Nwosu",
      initials: "KN",
      admissionNumber: "GFA/2024/005",
      class: "JSS 3",
      branch: {
        name: "Secondary - Ikeja",
        type: "Secondary",
        location: "Ikeja",
      },
      status: "Active",
    },
    {
      id: "stu_006",
      firstName: "Tunde",
      lastName: "Obi",
      fullName: "Tunde Obi",
      initials: "TO",
      admissionNumber: "GFA/2024/006",
      class: "Primary 6",
      branch: {
        name: "Primary - Ikeja",
        type: "Primary",
        location: "Ikeja",
      },
      status: "Suspended",
    },
    {
      id: "stu_007",
      firstName: "Zainab",
      lastName: "Aliyu",
      fullName: "Zainab Aliyu",
      initials: "ZA",
      admissionNumber: "GFA/2024/007",
      class: "SS 2",
      branch: {
        name: "Secondary - Ikeja",
        type: "Secondary",
        location: "Ikeja",
      },
      status: "Active",
    },
  ],
};
