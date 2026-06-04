import { DXAccordion } from "../atoms/accordion";

interface IJSONEditor{
	title?:string, onChange:any, value:any 
}
export function JSONEditor(props: IJSONEditor) {
	const { title = "Params", onChange, value = {} } = props;

	return (
		<DXAccordion title={title}>
			<textarea
				onChange={onChange}
				value={JSON.stringify(value, null, 2)}
				// readOnly={true}
				cols={34}
				rows={5}
			/>
		</DXAccordion>
	);
}
