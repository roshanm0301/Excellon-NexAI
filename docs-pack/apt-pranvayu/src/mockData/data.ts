export const StoredDefinition = {
    properties: {
        SystemName: "GetApplicationById",
        DisplayName: "Get Application By Id",
        SchemaId: "e9e0beb9-b3b9-4d6a-aed6-8bfaa3cad02d",
        Topic: "Action.Application",
    },
    sequence: [
        {
            id: "a8aa84db336e01dff0f2737d8ffbfe6e",
            componentType: "task",
            type: "Document",
            name: "Document",
            properties: {
                type: "POST",
            },
        },
        {
            id: "86d61d66f3b6a74f3a2b4a762d520872",
            componentType: "task",
            type: "Request",
            name: "Request",
            properties: {
                type: "GetById",
            },
        },
    ],
};


export const Company = {
    ID: 1,
    Name: 'Super Mart of the West',
    Address: '702 SW 8th Street',
    City: 'Bentonville',
    State: 'Arkansas',
    ZipCode: 72716,
    Phone: '(800) 555-2797',
    Fax: '(800) 555-2171',
    Website: {
        websiteName: 'google.com',
        websiteAddress: 'pune mh'
    },
    Active: true,
}
export const companies = [{
    ID: 1,
    Name: 'Super Mart of the West',
    Address: '702 SW 8th Street',
    City: 'Bentonville',
    State: 'Arkansas',
    ZipCode: 72716,
    Phone: '(800) 555-2797',
    Fax: '(800) 555-2171',
    Website:'',
    Active: true,
}, {
    ID: 2,
    Name: 'Electronics Depot',
    Address: '2455 Paces Ferry Road NW',
    City: 'Atlanta',
    State: 'Georgia',
    ZipCode: 30339,
    Phone: '(800) 595-3232',
    Fax: '(800) 595-3231',
    Website: '',
    Active: true,
}, {
    ID: 3,
    Name: 'K&S Music',
    Address: '1000 Nicllet Mall',
    City: 'Minneapolis',
    State: 'Minnesota',
    ZipCode: 55403,
    Phone: '(612) 304-6073',
    Fax: '(612) 304-6074',
    Website: '',
    Active: true,
}, {
    ID: 4,
    Name: "Tom's Club",
    Address: '999 Lake Drive',
    City: 'Issaquah',
    State: 'Washington',
    ZipCode: 98027,
    Phone: '(800) 955-2292',
    Fax: '(800) 955-2293',
    Website: '',
    Active: true,
}];


export const employeesList = ['John Heart', 'Samantha Bright', 'Arthur Miller', 'Robert Reagan', 'Greta Sims', 'Brett Wade',
    'Sandra Johnson', 'Ed Holmes', 'Barb Banks', 'Kevin Carter', 'Cindy Stanwick', 'Sammy Hill', 'Davey Jones', 'Victor Norris',
    'Mary Stern', 'Robin Cosworth', 'Kelly Rodriguez', 'James Anderson', 'Antony Remmen', 'Olivia Peyton', 'Taylor Riley',
    'Amelia Harper', 'Wally Hobbs', 'Brad Jameson', 'Karen Goodson', 'Marcus Orbison', 'Sandy Bright', 'Morgan Kennedy',
    'Violet Bailey', 'Ken Samuelson', 'Nat Maguiree', 'Bart Arnaz', 'Leah Simpson', 'Arnie Schwartz', 'Billy Zimmer', 'Samantha Piper',
    'Maggie Boxter', 'Terry Bradley', 'Gabe Jones', 'Lucy Ball', 'Jim Packard', 'Hannah Brookly', 'Harv Mudd', 'Clark Morgan',
    'Todd Hoffman', 'Jackie Garmin', 'Lincoln Bartlett', 'Brad Farkus', 'Jenny Hobbs', 'Dallas Lou', 'Stu Pizaro'];

export const IdentitySchema = {
    "_id": "77d56d3b-d39b-4a22-bd3d-72d47ad67627",
    "SystemName": "Identity",
    "DisplayName": "Identity",
    "TableName": "Identities",
    "Provider": "76c1dfe8-2ceb-4f3f-8094-d9b605fb5006",
    "SubscriptionId": "1b540302-4aa1-469f-9563-527953bf01f9",
    "PartitionKey": "1b540302-4aa1-469f-9563-527953bf01f9",
    "Columns": [
        {
            "type": "varchar",
            "primary": true,
            "objectId": true,
            "generated": "uuid",
            "name": "_id"
        },
        {
            "type": "varchar",
            "name": "id"
        },
        {
            "type": "varchar",
            "name": "SchemaId"
        },
        {
            "type": "varchar",
            "name": "PartitionKey"
        },
        {
            "type": "varchar",
            "name": "FirstName"
        },
        {
            "type": "varchar",
            "name": "LastName"
        },
        {
            "type": "varchar",
            "name": "Username"
        },
        {
            "type": "varchar",
            "name": "LoginName"
        },
        {
            "type": "varchar",
            "name": "MobileNo"
        },
        {
            "type": "varchar",
            "name": "Email"
        },
        {
            "type": "varchar",
            "name": "userId"
        },
        {
            "type": "varchar",
            "name": "LockTimeStamp"
        }
    ],
    "id": "77d56d3b-d39b-4a22-bd3d-72d47ad67627",
    "CreatedOn": "2023-03-15T05:32:10.764Z",
    "IsActive": true
}