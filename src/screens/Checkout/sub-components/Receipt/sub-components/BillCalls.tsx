import withObservables from '@nozbe/with-observables';
import dayjs from 'dayjs';
import { groupBy } from 'lodash';
import { HStack, ListItem, Separator, Text } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';
import type { Bill, BillCallLog, BillCallPrintLog } from '../../../../../models';
import { PrintStatus } from '../../../../../models/constants';

interface BillCallOuterProps {
  bill: Bill;
}

interface BillCallInnerProps {
  billCallLogs: BillCallLog[];
  billCallPrintLogs: BillCallPrintLog[];
}

export const BillCallsInner: React.FC<BillCallOuterProps & BillCallInnerProps> = ({
  billCallLogs,
  billCallPrintLogs,
}) => {
  const keyedLogs = groupBy(billCallPrintLogs, log => log.billCallLogId);

  if (billCallLogs.length == 0) {
    return null;
  }

  return (
    <>
      <Separator bordered>
        <Text>Calls</Text>
      </Separator>
      {billCallLogs.map(billCallLog => {
        const logs = keyedLogs[billCallLog.id] || [];

        const hasSucceeded = logs.length > 0 && logs.every(log => log.status === PrintStatus.succeeded);
        const hasErrored = logs.some(log => log.status === PrintStatus.errored);
        const isProcessing = logs.some(log => log.status === PrintStatus.processing);
        const isPending = logs.some(log => log.status === PrintStatus.pending);

        const status = hasSucceeded
          ? PrintStatus.succeeded
          : hasErrored
          ? PrintStatus.errored
          : isProcessing
          ? PrintStatus.processing
          : isPending
          ? PrintStatus.pending
          : null;

        return (
          <ListItem noIndent key={billCallLog.id} style={status ? styles[status] : {}}>
            <HStack flex={1} alignItems="center" justifyContent="space-between">
              <HStack flex={1}>
                <Text style={{ paddingRight: 10 }}>{dayjs(billCallLog.createdAt).format('HH:mm')}</Text>
              </HStack>
              <HStack flex={1} justifyContent="flex-end">
                <Text sub>{`Msg: ${billCallLog.printMessage || 'none'}`}</Text>
              </HStack>
            </HStack>
          </ListItem>
        );
      })}
    </>
  );
};

export const BillCalls = withObservables<BillCallOuterProps, BillCallInnerProps>(['bill'], ({ bill }) => ({
  bill,
  billCallPrintLogs: bill.overviewBillCallPrintLogs.observeWithColumns(['status']),
  billCallLogs: bill.billCallLogs,
}))(BillCallsInner);

const styles = StyleSheet.create({
  [PrintStatus.succeeded]: {
    borderLeftColor: 'green',
    borderLeftWidth: 4,
  },
  [PrintStatus.processing]: {
    borderLeftColor: 'yellow',
    borderLeftWidth: 4,
  },
  [PrintStatus.errored]: {
    borderLeftColor: 'red',
    borderLeftWidth: 4,
  },
  void: {
    color: 'red',
  },
  comp: {
    color: 'grey',
  },
});
