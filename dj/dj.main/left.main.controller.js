(function() {
		'use strict';

		angular
			.module('dj.main').controller('dj.main.left.controller', djMainLeftControllerFn);

		djMainLeftControllerFn.$inject = [
			'rest.service',
			'dj.generic.service',
			'$scope',
			'$rootScope',
			'Notification',
			'appConstants',
		];

		function djMainLeftControllerFn(restService, djGenericService, $scope, $rootScope, Notification, appConstants) {
			var vm = this;

			vm.hideAttendanceCheck = true;
			vm.hideAgenda = true;

			function processAttendanceSummary() {

				var presenceStates = vm.currentSeating.presenceStates,
					attendants = vm.currentSeating.attendants;

				return _.compact(_.map(presenceStates, function(item) {
					if (item.parent == '0') {
						item.children = _.filter(presenceStates, {'parent' : item.id }).map(function(child) {
							child.sum = _.countBy(attendants, { 'type' : child.id })['true'];
							if (!child.sum) {
								child.sum = 0;
							}
							return child;
						});
						item.sum = _.sumBy(item.children, 'sum');
						return item;
					}

				}));
			}

			vm.sendWScustom = function() {
				djGenericService.wsSender('client-to-channel-message', { 'def' : 'ghi' });
			}

			vm.nextStep = function(moveAhead) {

				var currentItemIdx = _.indexOf(_.map(vm.currentSeating.items, 'id'), vm.currentSeating.current_item),
					//nextOne = _.find(vm.currentSeating.items, function(x, idx) {
					//	return idx > currentItemIdx ? vm.currentSeating.items[idx] : false;
					//}),
					nextOne = vm.currentSeating.items[currentItemIdx + 1] || false;

				if (nextOne) {
					vm.isLastStep = false;
					if (moveAhead) {


						vm.activateItem(nextOne);


					}
				} else {
					vm.isLastStep = true;
				}

				vm.recommendedButtons = null;

			};

			vm.moveAhead = function() {
				var currentItem = _.find(vm.currentSeating.items, { 'id' : vm.currentSeating.current_item });
				if (currentItem.source == 'events') {

					djGenericService.getFromEndPoint('cases/' + currentItem.case.id + '/next_events', true).then(function(response) {
						vm.recommendedButtons = response.plain();
						vm.proceedItem = {
							'type': vm.recommendedButtons[0]
						};
						djGenericService.getFromEndPoint('seatings/?state=1,2,3').then(function(seatingsList) {
							var todaysPlenum = moment(vm.currentSeating.date),
								upcomingSeatings = _.filter(seatingsList.plain(), function(seating) {
									return (
										todaysPlenum.isSameOrBefore(seating.date, 'd')
										&&
										seating.type == appConstants.SEATING_TYPES[0].id
										&&
										seating.id != vm.currentSeating.id
									);
								});
							vm.moveToUpcomingSeating = upcomingSeatings.slice(0, 3);
							vm.proceedItem.seating = vm.moveToUpcomingSeating[0];
						});
					});

				}
			};


			$scope.$watch("vm.proceedItem.type", function(newVal, oldVal) {
				if (newVal) {
					vm.mustChooseSeating = (newVal.in_seating != '0');
				}
			});

			vm.addItemAndMoveAhead = function() {
				// add event.
				var currentItem = _.find(vm.currentSeating.items, { 'id' : vm.currentSeating.current_item });

				djGenericService.postToEndPoint('events', {
					'type' : vm.proceedItem.type.id,
					'case' : currentItem.case.id
				}).then(function (successResponse) {
					console.log('saved', successResponse);

					if (vm.proceedItem.type.in_seating != '0') {

						djGenericService.postToEndPoint('events/' + successResponse[0] + '/reassign/' + vm.proceedItem.seating.id, {}).then(function (reassignedResponse) {
							console.log('reassigned', reassignedResponse);
						});
					}



				});





				// move to right seating.
				// move ahead.
			}



			function markItem(id) {
				var r2 = _.findIndex(vm.currentSeating.items, function (item) {
					return item.id == id;
				});

				return _.map(vm.currentSeating.items, function (item, idx) {
					item.visible = idx >= (r2 - 1);
					return item;
				});
			}

			$scope.$on('dj.generic:setSeating', function (ev, seating) {
				var currentCase;

				djGenericService.fullSeating(seating).then(function (data) {

					vm.currentSeating = data;

					vm.attendanceSum = processAttendanceSummary();
					vm.nextStep(false); /* set next item, do not move ahead though */
					if (data.items.length > 0) {

						if (!data.current_item) {
							//	currentCase = _.first(data.items).case;
						} else {
							//	currentCase = _.first(_.filter(data.items, {'id': data.current_item})).case;
						}

						//vm.currentSeating.items = markItem(vm.currentSeating.current_item);
						//$rootScope.$broadcast('case_updated', currentCase.id);
					}
				});
			});


			$scope.$on('ws:current_item_changed', function (ev, data) {
				vm.currentSeating.current_item = data.event;
				//vm.currentSeating.items = markItem(vm.currentSeating.current_item);
				var thisItem = _.first(_.filter(vm.currentSeating.items, {'id': data.event}));
				$rootScope.$broadcast('case_updated', thisItem.case.id);
				$scope.$apply();
				Notification.success('Nytt ärende: ' + thisItem.case.title);
			});

			vm.changeCase = function (caseId) {
				$rootScope.$broadcast('case_updated', caseId);
			};


			vm.activateItem = function(item) {
				djService.activateItem(item).then(function() {
					vm.currentSeating.current_item = item.id;
					//vm.nextStep(false);
				});
			};

			vm.changeSeatingState = function(stateId) {


				if (stateId == 4) { // starta plenum

					restService.get('staff').getList().then(function (staffData) {
						return staffData.plain();
					}).then(function(staffList) {
						restService.get('persons').getList().then(function (personsList) {

							personsList = _.filter(personsList.plain(), function(item) { /* filter for being part of parliament and sort by rank within parliament */
									var relevantBinding = _.find(item.bindings, function(binding) {

										return moment(new Date()).isBetween(
												moment(binding.period_start),
												moment(binding.period_end),
												'days',
												true) &&
											binding.organization == appConstants.PARLIAMENT.organization
											&&
											_.indexOf(appConstants.PARLIAMENT.elected_roles, binding.role) !== -1;
									});

									if (relevantBinding) {
										item.rank = _.indexOf(appConstants.PARLIAMENT.elected_roles, relevantBinding.role);
										item.relevantBinding = relevantBinding;
										return item;
									}
									return false;
								});

							personsList = _.sortBy(personsList, 'rank', 'name');

							vm.chooseForStart = {
								'speakers' : personsList,
								'secretaries' : staffList
							};

							vm.startPlenum = function(currentSpeakerId, currentSecretaryId) {

								djGenericService.postToEndPoint('comments', { /* add secretary */
									'branch': vm.currentSeating.id,
									'type' : 236,
									'target' : {
										'id' : currentSecretaryId,
									}
								}).then(function(response) {
									djGenericService.postToEndPoint('comments', { /* add speaker */
											'branch': vm.currentSeating.id,
											'type' : 235,
											'target' : {
												'id' : currentSpeakerId,
											}
										}
									);
								}).then(function() { /* finally, update seating's state */
									djGenericService.updateSeatingState(stateId);
								});
							}

						});
					});


				}

				if (stateId == 5) { // avsluta plenum
					djGenericService.updateSeatingState(stateId).then(function() {

					});
				}

			};

			vm.activateAttendance = function() {
				var oldState = vm.currentSeating.attendance_check == 1;
				vm.currentSeating.attendance_check = !oldState;
				djGenericService.updateSeatingAttendanceCheck(!oldState).then(function() {
					console.log('return from controller');
				});
			};


			$scope.$watch("vm.voting.forId", function(newVal, oldVal) {
				if (newVal) {
					vm.voting = { 'forId' : newVal };
					var item = _.find(vm.currentSeating.items, { 'id' : newVal });
					if (item.votings.length > 0) {
						  djGenericService.getFromEndPoint('votings/' + item.votings.join(',') + '?as_array=true').then(function(result) {
						  	vm.voting.previousVotings = result.plain();
						  });
					} else {
						vm.voting.previousVotings = null;
					}
				}

			});

			vm.saveVoting = function() {
				var thisPromise;
				if (vm.voting.isUpdate) {
					thisPromise = djGenericService.updateToEndPoint('votings', vm.voting.details).then(function() {
						return [ vm.voting.details.id ];
					});
				} else {
					thisPromise = djGenericService.postToEndPoint('votings', vm.voting.details);
				}

				thisPromise.then(function(result) {
					console.log('promise resolved', result);
					var event = _.find(vm.currentSeating.items, { 'id' : vm.voting.forId }),
						newId = result[0];

					if (vm.voting.sequence) {
						var newPos = _.indexOf(event.votings, vm.voting.sequence) + 1;
						console.log('before', event.votings, 'shall be before', vm.voting.sequence, newPos);
						if (vm.voting.isUpdate && newId != vm.voting.sequence) {

							event.votings = _.without(event.votings, newId);
							var moveAfterIdx = _.indexOf(event.votings, vm.voting.sequence) + 1;
							event.votings.splice(moveAfterIdx, 0, newId);

						} else {
							event.votings.splice(newPos, 0, newId);
						}
					} else { /* append last */
						event.votings.push(newId);
					}

					djGenericService.updateToEndPoint('events', {
						'id' : event.id,
						'votings' : event.votings
					}).then(function(updatedEvent) {
						vm.voting = null;
					});
				})
			};

			vm.editVoting = function(voting) {
				vm.voting.details = _.pick(voting, ['id', 'title', 'alt_text_yes', 'alt_text_no']);
				vm.voting.isUpdate = true;
				var event = _.find(vm.currentSeating.items, { 'id' : vm.voting.forId }),
					thisPos = _.indexOf(event.votings, voting.id);

				if (thisPos > 0) {
					vm.voting.sequence = vm.voting.previousVotings[thisPos - 1].id;
				} else {
					vm.voting.sequence = '0';
				}
			}

			$scope.$on('ws:member_registered', function (ev, data) {

				vm.currentSeating.attendants = _.sortBy(data, 'name');
				vm.attendanceSum = processAttendanceSummary();
				$scope.$apply();

			});


		}
	}
)();
