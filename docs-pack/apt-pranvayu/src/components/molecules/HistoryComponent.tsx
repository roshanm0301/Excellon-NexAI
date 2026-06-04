import { useNavigate } from 'react-router-dom'

export const HistoryComponent = (props: any) => {
    const { versionNo, id, formData, Name, EntityType, ParentDocumentId, CommitDate } = props

    const navigate = useNavigate()
    const showFile = () => {
        localStorage.setItem("EntityType", JSON.stringify(EntityType));
        localStorage.setItem("formData", JSON.stringify(formData));
        localStorage.setItem("revertId", id)

        navigate(`/schema/history-view-file/${ParentDocumentId}`)

    }
    return (
        <div>

            <div className="history-container">
                <div style={{ display: "flex", flexDirection: "row", }}>
                    <div>
                        <div style={{ paddingLeft: "20px" }}>
                            <div className='verticle-line' />
                        </div>
                        <div>
                            <span className="dot"></span>
                        </div>
                        <div style={{ paddingLeft: "20px" }}>
                            <div className='verticle-line' />
                        </div>
                    </div>

                    <div className='div-class'>
                        <span className="history-content"><span style={{ color: "var(--text-secondary)" }}>Version No : </span>{versionNo}</span>
                        <div className="history-content"><span style={{ color: "var(--text-secondary)" }}>System Name : </span>{Name}</div>
                        <div className="history-content">
                            <span style={{ color: "var(--text-secondary)" }}>Commit Date :</span> {CommitDate}</div>
                        <div className="history-content"><span onClick={showFile}>View File</span></div>
                    </div>
                </div>

            </div>
        </div>
    )
}
