import { ContextMenu, ScrollView, TreeView } from "devextreme-react";
import { useEffect, useState } from "react";
import { DXButton } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { getActionAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { CheckoutProcess } from "./checkoutProcess";
import { AboutAction } from "./schema.aboutAction";
import { formDefinition, requestType } from "./schema.entity";
import LockIcon from "../../assets/lockIcon.svg"
import unLockIcon from "../../assets/unlockIcon.svg";

const SchemaTreeViewComponent = (props: any) => {
    const {
        schemaActionList,
        onAddActionClick,
        onRefreshClick,
        handleTreeViewContextMenu,
        scrollViewHeight,
    } = props;
    const dispatch = useAppDispatch();
    const [isSchemaCheckoutOpen, setIsSchemaCheckoutOpen] = useState(false);
    const [selectedItemForContextMenu, setSelectedItemForContextMenu] =
        useState<any>({});
    const [isActionCheckoutOpen, setIsActionCheckoutOpen] = useState(false);
    const [formData, setFormData] = useState({ ...formDefinition });
    const [id, setDocumentId] = useState<any>("");
    const [schemaId, setSchemaId] = useState("");
    const [isActionAboutOpen, setIsActionAboutOpen] = useState(false);
    const [actionData, setActionData] = useState<any>(null)
    const [schemaData, setSchemaData] = useState<any>(null)

    const addAction = async (item: any) => {
        const { text } = item.itemData;
        switch (text) {
            case "Add New Workflow":
                onAddActionClick(item.itemData.selectedItemForContextMenu);
                break;
            case "Checkout Schema":
                const schemaResult: any = await dispatch(getActionAPI(item.itemData.selectedItemForContextMenu.id));
                setIsSchemaCheckoutOpen(true);
                setSchemaData(schemaResult)
                break;
            case "Checkout Workflow":
                const actionResult: any = await dispatch(getActionAPI(item.itemData.selectedItemForContextMenu.id));
                setIsActionCheckoutOpen(true);
                setActionData(actionResult)
                break;
            case "Add Documentation":
                onOpenPopup(item);
                setSchemaId(selectedItemForContextMenu?.id);
                break;
            case "Refresh":
                onRefreshClick(selectedItemForContextMenu);
                break;
            default:
                break;
        }
    };

    const contextMenuItems = [
        {
            text: "Add New Workflow",
            icon: "plus",
            selectedItemForContextMenu,
            visible: selectedItemForContextMenu.Type !== "Action",
        },
        {
            text:
                selectedItemForContextMenu.Type === "Action"
                    ? "Checkout Workflow"
                    : "Checkout Schema",
            selectedItemForContextMenu,
            icon: "edit",
            visible: selectedItemForContextMenu.Status === requestType.Publish,
        },
        {
            text: "Add Documentation",
            selectedItemForContextMenu,
            icon: "doc",
            visible: selectedItemForContextMenu.Type === "Action",
        },
        {
            text: "Refresh",
            icon: "refresh",
        },
    ];

    const onOpenPopup = async (e: any) => {
        const result: any = await dispatch(
            getActionAPI(e?.itemData?.selectedItemForContextMenu?.id)
        );
        const _formData = {
            ...formData,
            ...result,
        };
        setFormData({ ..._formData });
        setDocumentId(e?.itemData?.selectedItemForContextMenu?.id);
        setIsActionAboutOpen(true);
    };

    const onHiding = () => {
        setIsActionAboutOpen(false);
        setFormData({
            ...formData,
            Tags: [],
            Description: "",
            Help: "",
        });
    };

    const onContextMenuClick = (e: any, node: any) => {
        setSelectedItemForContextMenu(node);
    };

    const renderNode = (node: any) => {
        return (
            <div className="custom-treeview-item">
                <div
                    style={{ width: "100%" }}
                    onClick={() => handleTreeViewContextMenu(node)}
                >
                    <div className="selected-node">
                        <span style={{ padding: '2px' }} className={node.Type === "Schema" ? "dx-icon-folder iconSchema" : "dx-icon-repeat icon"} />
                        <img
                            alt={""}
                            className={node?.Status === "PUBLISHED" ? "lock-image" : "unlock-image"}
                            src={node?.Status === "PUBLISHED" ? LockIcon : unLockIcon}
                        />
                        <span style={{ fontSize: '12px' }}>{node.text}</span>
                    </div>
                </div>
                <DXButton
                    id="open-context"
                    text=""
                    icon="overflow"
                    stylingMode="text"
                    style={{ height: "20px", marginLeft: "0px" }}
                    onClick={(e) => onContextMenuClick(e, node)}
                />
            </div>
        );
    };

    return (
        <div
            className={props.isDivOpen && "tree-border"}
            style={{
                width: props.isDivOpen ? "20%" : "",
                minWidth: props.isDivOpen ? "20%" : "",
            }}
        >
            {/* tree view */}
            <div className="drive-panel">
                {/* <div className="drive-header dx-treeview-item">
            <div className="dx-treeview-item-content">
                <i className="dx-icon dx-icon-activefolder"></i><span>Manage Schema/WF</span></div></div> */}
                {props.isDivOpen === true && (
                    <ScrollView height={scrollViewHeight} width={"100%"} direction="vertical">
                        <div style={{ cursor: "pointer" }}>
                            <TreeView
                                items={schemaActionList}
                                searchEnabled={true}
                                width="100%"
                                itemRender={renderNode}
                            />
                        </div>
                    </ScrollView>
                )}
            </div>
            <ContextMenu
                dataSource={contextMenuItems}
                width={160}
                target="#open-context"
                showEvent="dxcontextmenu click"
                onItemClick={(item: any) => addAction(item)}
            />

            {/* popup for schema checkout */}
            <DXPopup
                title=""
                visible={isSchemaCheckoutOpen}
                onHiding={() => setIsActionAboutOpen(false)}
                showCloseButton={false}
                showTitle={false}
                width="400px"
                height="300px"
            >
                <CheckoutProcess
                    data={schemaData}
                    setIsOpen={(e: any) => setIsSchemaCheckoutOpen(e)}
                />
            </DXPopup>

            {/* popup for action about */}
            <DXPopup
                visible={isActionAboutOpen}
                title={"Documentation"}
                onHiding={onHiding}
                width="700px"
                height="550px"
            >
                <AboutAction
                    schemaId={schemaId}
                    id={id}
                    data={formData}
                    setIsOpen={(e: any) => setIsActionAboutOpen(false)}
                />
            </DXPopup>

            {/* popup for action checkout */}
            <DXPopup
                title=""
                visible={isActionCheckoutOpen}
                onHiding={() => setIsActionCheckoutOpen(false)}
                showCloseButton={false}
                showTitle={false}
                width="400px"
                height="300px"
            >
                <CheckoutProcess
                    data={actionData}
                    setIsOpen={(e: any) => setIsActionCheckoutOpen(e)}
                />
            </DXPopup>
        </div>
    );
};

export default SchemaTreeViewComponent;
