import React, { useState } from 'react'
import { useNavigate } from "react-router";
import "../dashboard/dashboard.scss";
import { useEffect } from "react";
import ApplicationIcon from "../../../src/assets/icon-applications.svg";
import RoleIcon from "../../../src/assets/icon-role.svg";
import SchemaIcon from "../../../src/assets/icon-schema.svg";
import { GetCountByActionType, GetCountOfSystemService, GetStatusWiseCountByType, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { DxGraph } from "./graph";
import { requestType } from '../schema';
import { SkeletonDashboard } from '../../components/ui/Skeleton/Skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [checkoutData, setCheckoutData] = useState<any>({});
  const [pullRequestData, setPullRequestData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  let { dashboardCount } = useAppSelector((state) => state.dashboard);
  let { actionCount } = useAppSelector((state) => state.dashboard);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);
  let navigationList = useAppSelector((state) => state.role.navigationList)

  useEffect(() => {
    CountApiCalls();
  }, [])

  useEffect(() => {
    if (IsSubscriptionChanged === true) {
      CountApiCalls();
      dispatch(subscriptionChange(false))
    }
  }, [IsSubscriptionChanged])

  const CountApiCalls = async () => {
    setLoading(true);
    dispatch(GetCountOfSystemService(null));
    dispatch(GetCountByActionType(null));
    const payload = { Type: requestType.CheckoutRequest }
    const payloadForPullRequest = { Type: requestType.PullRequest }
    const result: any = await dispatch(GetStatusWiseCountByType(payload));
    if (result?.success === true) setCheckoutData(result?.data)
    const resultForPullRequest: any = await dispatch(GetStatusWiseCountByType(payloadForPullRequest));
    if (resultForPullRequest?.success === true) setPullRequestData(resultForPullRequest?.data)
    setLoading(false);
  }

  const RestructureRequestData = (data: any) => {
    if (data.hasOwnProperty('PENDINGFORAPPROVAL')) { data.PENDING = data.PENDINGFORAPPROVAL; delete data.PENDINGFORAPPROVAL }
    if (data.hasOwnProperty("RESUBMITFORAPPROVAL")) { data.RESUBMIT = data.RESUBMITFORAPPROVAL; delete data.RESUBMITFORAPPROVAL }
    if (data.hasOwnProperty("CANCELLEDBYUSER")) { data.CANCEL = data.CANCELLEDBYUSER; delete data.CANCELLEDBYUSER }
    return Object.keys(data).map((item) => {
      return {
        status: item,
        val: data[item]
      }
    })
  }

  let arrayForAction: any = []
  for (const key in actionCount) {
    if (actionCount.hasOwnProperty(key)) {
      let obj = {
        status: key,
        val: actionCount[key]
      }
      arrayForAction.push(obj)
    }
  }

  // Build KPI cards data
  const kpiCards = navigationList?.map((item: any) => {
    if (item?.path === "/schema") {
      return {
        key: 'schema',
        label: 'Schema',
        icon: SchemaIcon,
        count: dashboardCount?.Schema ?? 0,
        path: '/schema',
        color: '--color-primary',
      };
    }
    if (item?.path === "/application") {
      return {
        key: 'application',
        label: 'Application',
        icon: ApplicationIcon,
        count: dashboardCount?.Application ?? 0,
        path: '/application',
        color: '--color-success',
      };
    }
    if (item?.path === "/role") {
      return {
        key: 'role',
        label: 'Roles',
        icon: RoleIcon,
        count: dashboardCount?.Role ?? 0,
        path: '/role',
        color: '--color-info',
      };
    }
    return null;
  }).filter(Boolean) || [];

  const hasSchema = navigationList?.some((i: any) => i?.path === "/schema");

  // Quick actions for common workflows
  const quickActions = [
    { label: 'Create Schema', desc: 'Start a new schema definition', icon: 'ðŸ“‹', path: '/schema' },
    { label: 'View Applications', desc: 'Manage your applications', icon: 'ðŸ”§', path: '/application' },
    { label: 'Manage Roles', desc: 'Configure role permissions', icon: 'ðŸ”', path: '/role' },
  ].filter(action => navigationList?.some((n: any) => n.path === action.path));

  if (loading) {
    return (
      <div className="dashboard-modern">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="dashboard-modern">
      {/* Page Header */}
      <div className="dashboard-modern__header">
        <div className="dashboard-modern__header-content">
          <h1 className="dashboard-modern__title">Dashboard</h1>
          <p className="dashboard-modern__subtitle">
            Overview of your workspace activity and resources
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiCards.length > 0 ? (
        <div className="dashboard-kpis">
          {kpiCards.map((kpi: any) => (
            <div key={kpi.key} className="kpi-card" onClick={() => navigate(kpi.path)}>
              <div className="kpi-card__header">
                <div className="kpi-card__icon">
                  <img alt={kpi.label} src={kpi.icon} />
                </div>
                <span className="kpi-card__trend kpi-card__trend--neutral">
                  Active
                </span>
              </div>
              <div className="kpi-card__value">{kpi.count}</div>
              <div className="kpi-card__label">{kpi.label}</div>
              <button className="kpi-card__action" onClick={(e) => { e.stopPropagation(); navigate(kpi.path); }}>
                View {kpi.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <div className="dashboard-empty__icon">ðŸ“Š</div>
          <div className="dashboard-empty__title">No data available yet</div>
          <div className="dashboard-empty__desc">
            Your dashboard will display metrics and insights once you start creating schemas and applications.
          </div>
        </div>
      )}

      {/* Charts + Quick Actions Grid */}
      <div className="dashboard-grid">
        {/* Charts Section */}
        <div className="dashboard-charts">
          {hasSchema && (
            <>
              <div className="chart-card">
                <div className="chart-card__header">
                  <div>
                    <div className="chart-card__title">Actions</div>
                    <div className="chart-card__subtitle">Distribution by type</div>
                  </div>
                </div>
                <DxGraph
                  text=""
                  dataSource={arrayForAction}
                  type="bar"
                  argumentField="status"
                  visible={false}
                  valueField="val"
                />
              </div>
              <div className="chart-card">
                <div className="chart-card__header">
                  <div>
                    <div className="chart-card__title">Checkout Requests</div>
                    <div className="chart-card__subtitle">Status breakdown</div>
                  </div>
                </div>
                <DxGraph
                  text=""
                  dataSource={RestructureRequestData(checkoutData)}
                  type="bar"
                  argumentField="status"
                  visible={false}
                  valueField="val"
                />
              </div>
              <div className="chart-card">
                <div className="chart-card__header">
                  <div>
                    <div className="chart-card__title">Pull Requests</div>
                    <div className="chart-card__subtitle">Status breakdown</div>
                  </div>
                </div>
                <DxGraph
                  text=""
                  dataSource={RestructureRequestData(pullRequestData)}
                  type="bar"
                  argumentField="status"
                  visible={false}
                  valueField="val"
                />
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="quick-actions">
            <div className="quick-actions__title">Quick Actions</div>
            {quickActions.map((action, idx) => (
              <div key={idx} className="quick-action-item" onClick={() => navigate(action.path)}>
                <div className="quick-action-item__icon">{action.icon}</div>
                <div className="quick-action-item__content">
                  <div className="quick-action-item__label">{action.label}</div>
                  <div className="quick-action-item__desc">{action.desc}</div>
                </div>
                <svg className="quick-action-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}

            {/* Activity Feed */}
            <div className="dashboard-activity-divider">
              <div className="activity-feed__title">Recent Activity</div>
              <div className="activity-item">
                <div className="activity-item__dot" />
                <div className="activity-item__content">
                  <div className="activity-item__text">Dashboard loaded successfully</div>
                  <div className="activity-item__time">Just now</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-item__dot activity-item__dot--success" />
                <div className="activity-item__content">
                  <div className="activity-item__text">System services are running</div>
                  <div className="activity-item__time">Active</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
