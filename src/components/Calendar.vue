<script setup lang="ts">
import { calendar } from './data';
import OneDay from './OneDay.vue';
const weekNames = ["一", "二", "三", "四", "五", "六", "日"];
</script>
<template>
    <table class="table table-striped calendar-table">
        <thead>
            <tr>
                <th v-for="i in weekNames" class="fs-4 text-center">{{ i }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="week in calendar">
                <OneDay v-for="day in week" :="day">
                </OneDay>
            </tr>
        </tbody>
    </table>
</template>
<style lang="less">
table.calendar-table>tbody>tr>td {
    max-width: calc(100% / 7);
    width: 100%;
}
</style>