import { applyMiddleware, createStore, compose, Action } from 'redux';
import thunkMiddleware, { ThunkAction } from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import rootReducer from '../redux/reducer';

const loggerMiddleware = createLogger();
function noop() { }

function configureStore(preloadedState = {}) {

  let middlewares = [thunkMiddleware, loggerMiddleware];
  if (process.env.REACT_APP_STAGE === 'dev') {
    middlewares = [thunkMiddleware, loggerMiddleware];
  } else {
    middlewares = [thunkMiddleware];
    console.warn = noop;
  }
  const middlewareEnhancer = composeWithDevTools(
    applyMiddleware(...middlewares)
  );
  
  const composedEnhancers = compose(middlewareEnhancer);
  const store = createStore(rootReducer, preloadedState, composedEnhancers);

  return store;
}

export const store = configureStore();
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;