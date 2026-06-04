import { v4 } from "uuid";
export interface UserManagement{
  id: string,
  FirstName:string,
  LastName: string,
  RoleId:string,
  MobileNumber:string,
  Email:string,
  Upload: [],
  Subscriptions: []
}

export const userDefinition = {
  id: v4(),
  FirstName: "",
  LastName: "",
  RoleId: "",
  MobileNo: "",
  Email: "",
  Upload: [],
  Subscriptions: [],
  Username: '',
  Password: '' ,
  ConfirmPassword:''
};

export const employee: any = [
  {
    ID: 1,
    FirstName: "Dhanashri",
    LastName: "Patil",
    Picture: "images/employees/06.png",
    Role: "writer",
    MobileNumber: "9878987899",
    Subscription: "Subscription"
  },
  {
    ID: 2,
    FirstName: "Ambika",
    LastName: "Kandalkar",
    Picture: "images/employees/09.png",
    Role: "writer",
    MobileNumber: "9878987899",
    Subscription: "Subscription"
  },
  {
    ID: 3,
    FirstName: "Raj",
    LastName: "Sarbere",
    Picture: "images/employees/07.png",
    Role: "collaborator",
    MobileNumber: "9878987899",
    Subscription: "Subscription"
  },
  {
    ID: 4,
    FirstName: "Parvati",
    LastName: "Faltankar",
    Picture: "images/employees/04.png",
    Role: "Admin",
    MobileNumber: "9878987899",
    Subscription: "Subscription"
  },
];