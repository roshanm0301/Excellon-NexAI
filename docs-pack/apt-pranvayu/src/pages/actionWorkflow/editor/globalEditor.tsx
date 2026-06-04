import { memo } from "react";
import { Action } from "..";
export const GlobalEditor = (props: any) => {
	const { isTemplateView } = props
	return (
		// <StoreProvider store={store}>
		<Action  isTemplateView={isTemplateView}/>

		// </StoreProvider>
	);
}
