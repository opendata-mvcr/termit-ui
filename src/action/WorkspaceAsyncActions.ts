import { IRI } from "../util/VocabularyUtils";
import ActionType from "./ActionType";
import { GetStoreState, ThunkDispatch } from "../util/Types";
import * as SyncActions from "./SyncActions";
import {
  asyncActionFailure,
  asyncActionRequest,
  asyncActionSuccessWithPayload,
  publishMessage,
} from "./SyncActions";
import Ajax, { param } from "../util/Ajax";
import Constants from "../util/Constants";
import { ErrorData } from "../model/ErrorInfo";
import Message from "../model/Message";
import MessageType from "../model/MessageType";
import JsonLdUtils from "../util/JsonLdUtils";
import Workspace, {
  CONTEXT as WORKSPACE_CONTEXT,
  WorkspaceData,
} from "../model/Workspace";
import { AxiosResponse } from "axios";

export function selectWorkspace(iri: IRI) {
  const action = { type: ActionType.SELECT_WORKSPACE };
  return (dispatch: ThunkDispatch, getState: GetStoreState) => {
    if (
      getState().workspace &&
      getState().workspace!.iri === `${iri.namespace}${iri.fragment}`
    ) {
      return Promise.resolve({});
    }
    dispatch(asyncActionRequest(action));
    return Ajax.put(
      `${Constants.API_PREFIX}/workspaces/${iri.fragment}`,
      param("namespace", iri.namespace).accept(Constants.JSON_LD_MIME_TYPE)
    )
      .then((resp: AxiosResponse) =>
        JsonLdUtils.compactAndResolveReferences<WorkspaceData>(
          resp.data,
          WORKSPACE_CONTEXT
        )
      )
      .then((data: WorkspaceData) => {
        dispatch(
          publishMessage(
            new Message(
              {
                messageId: "workspace.select.success",
                values: { name: data.label },
              },
              MessageType.SUCCESS
            )
          )
        );
        return dispatch(
          asyncActionSuccessWithPayload(action, new Workspace(data))
        );
      })
      .catch((error: ErrorData) => {
        dispatch(asyncActionFailure(action, error));
        dispatch(
          SyncActions.publishMessage(new Message(error, MessageType.ERROR))
        );
        return undefined;
      });
  };
}

export function loadCurrentWorkspace() {
  const action = { type: ActionType.LOAD_WORKSPACE };
  return (dispatch: ThunkDispatch) => {
    dispatch(asyncActionRequest(action));
    return Ajax.get(`${Constants.API_PREFIX}/workspaces/current`)
      .then((data) =>
        JsonLdUtils.compactAndResolveReferences<WorkspaceData>(
          data,
          WORKSPACE_CONTEXT
        )
      )
      .then((data: WorkspaceData) => {
        dispatch(
          publishMessage(
            new Message(
              {
                messageId: "workspace.select.success",
                values: { name: data.label },
              },
              MessageType.SUCCESS
            )
          )
        );
        return dispatch(
          asyncActionSuccessWithPayload(action, new Workspace(data))
        );
      })
      .catch((error: ErrorData) => dispatch(asyncActionFailure(action, error)));
  };
}
