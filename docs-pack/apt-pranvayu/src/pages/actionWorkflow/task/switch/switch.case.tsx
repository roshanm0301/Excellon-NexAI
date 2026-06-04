import { ClickEvent } from "devextreme/ui/button";
import { useState } from "react";
import ClearIcon from "../../../../assets/img_277948.svg";
import PlusIcon from "../../../../assets/plus-icon.svg";
import { DXButton, DXInput, DXSelect } from "../../../../components/atoms";
import { SwitchStep } from "../../../../designer";

export const SwitchCase = (props: any) => {
  const { name, step, setName, notifyChildrenChanged } = props;

  const switchStep = step as SwitchStep;
  const [branches, setBranches] = useState(switchStep.branches);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [error, setError] = useState("");
  const [rename, setRename] = useState(false);

  function onNameChanged(e: any) {
    setName(e);
  }

  function onBranchSelectionChanged(e: any) {
    const value = e;
    if (value !== "default") {
      setSelectedBranch(value);
      setNewBranch(value);
      setRename(true)
    }
  }

  function addNewBranch() {
    setSelectedBranch("");
    setNewBranch("");
    setError("");
  }

  function onBranchChanged(e: any) {
    setNewBranch(e);
  }

  function saveBranch(e: ClickEvent) {
    // check for duplicate branch....
    let existingBranchData: any

    if (branches.hasOwnProperty(newBranch)) {
      setError("Duplicate case not allowed");
      return;
    }
    if (selectedBranch !== "") {
      setSelectedBranch(newBranch);
      existingBranchData = branches[selectedBranch]
      delete branches[selectedBranch];
      delete switchStep.branches[selectedBranch];
    } else {
      setError("");
      setNewBranch(newBranch);
    }
    if (rename) {
      setBranches({ ...branches, [newBranch]: existingBranchData });
      switchStep.branches[newBranch] = existingBranchData;
    } else {
      setBranches({ ...branches, [newBranch]: [] });
      switchStep.branches[newBranch] = [];
    }
    notifyChildrenChanged();

  }

  function deleteBranch() {
    if (branches.hasOwnProperty(selectedBranch)) {
      delete branches[selectedBranch];
      delete switchStep.branches[selectedBranch];
      notifyChildrenChanged();
    }
  }

  return (
    <>
      <DXInput
        type="text"
        required={true}
        label="Name"
        value={(name as string) || ""}
        onChange={onNameChanged}
      />
      <br />
      <div style={{ display: "flex" }}>
        <DXSelect
          required={true}
          items={Object.keys(branches)}
          value={(selectedBranch as string) || ""}
          onValueChange={onBranchSelectionChanged}
        />

        <DXButton text="" icon={PlusIcon} onClick={addNewBranch} />

        <DXButton
          text=""
          icon={ClearIcon}
          onClick={deleteBranch}
        />
      </div>
      <br />
      <div style={{ display: "flex" }}>
        <DXInput
          required={true}
          label="Enter case"
          value={(newBranch as string) || ""}
          onChange={(e: any) => onBranchChanged(e)}
        />

        <div style={{ display: "flex", marginTop: "7px" }}>
          <DXButton
            stylingMode={"contained"}
            text="Save"
            icon="save"
            onClick={saveBranch}
          />
        </div>
      </div>
      <div style={{ color: "var(--color-error, #f14c4c)" }}>{error}</div>
    </>
  );
};
