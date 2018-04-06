<?php

$intranetPath = "intranet.lagtinget.ax";
$intranetFilePath = "/var/www/" . $intranetPath;
require "../" . $intranetPath . "/helpers.inc.php";

?>
<!DOCTYPE html>
<html lang="en" data-ng-app="view">
	<head>
		<base href="/">
		<meta charset="utf-8" />
		<title>Ålands lagting | Klient </title>
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta content="width=device-width, initial-scale=1" name="viewport" />
		<meta content="Intranet" name="description" />
		<meta content="Ålands lagting" name="author" />
		<link href="//fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=all" rel="stylesheet" type="text/css" />
		<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />

		<link href="//<?=$intranetPath?>/assets/global/plugins/bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" />

		<link href="//<?=$intranetPath?>/assets/global/plugins/angular-loading-bar-0.9.0/angular-loading-bar-0.9.0.css" rel="stylesheet" type="text/css" />

		<link rel="shortcut icon" href="favicon.ico" />
		<link rel="stylesheet" href="/assets/angular-ui-notification.min.css" />
		<link rel="stylesheet" href="https://client.lagtinget.ax/assets/css/bootwatch.slate.3.3.7.min.css" />
		<link rel="stylesheet" href="/assets/custom/common.css" />
		<link rel="stylesheet" href="/assets/custom/client.css" />


		<meta name="apple-mobile-web-app-capable" content="yes" />

	</head>

	<body ng-cloak>

		<div id="header" class="navbar navbar-default" ng-controller="view.topnav.controller as vm">
			<div class="container-fluid">
				<div class="row">

					<div class="col col-md-5">
						<h3 ng-if="vm.currentSeating">
							{{ vm.currentSeating.type == '1' ? 'Plenum' : 'Frågestund' }}
						</h3>
					</div>

					<div class="col col-md-2 text-center">
						<h3>
							<i class="fa fa-clock-o" aria-hidden="true"></i> {{ vm.clock | date : 'H'}}{{ vm.showDots ? ':' : ' ' }}{{ vm.clock | date : 'mm' }}



						</h3>
					</div>

					<div class="col col-md-5">
						<h3 class="pull-right">
							<i class="fa fa-user-circle-o" aria-hidden="true"></i> {{ vm.user.person.name ? vm.user.person.name : vm.user.name }}
						</h3>
					</div>

				</div>
			</div>
		</div>

		<div id="wrapper">

			<div ng-controller="view.controller as vm">
				<div ng-include="'/view/main.tpl.html'"></div>
			</div>
<!--
			<div id="sidebar-wrapper" class="transformable" ng-class="{ 'col-md-3' : vm.narrowCol, 'col-md-9' : !vm.narrowCol }" ng-controller="client.main.right.controller as vm">
				<div id="sidebar" class="col-md-12">
				    <div ng-include="'/client/client.main/right.tpl.html'"></div>
				</div>
			</div>
			-->


		</div>

		<script src="//ws.lagtinget.ax:8080/socket.io/socket.io.js"></script>

		<script src="//<?=$intranetPath?>/assets/global/plugins/lodash.min.js" type="text/javascript"></script>

		<script src="//<?=$intranetPath?>/assets/custom/moment/moment-with-locales.min.js" type="text/javascript"></script>
		<script src="//<?=$intranetPath?>/assets/custom/custom.js" type="text/javascript"></script>

<?php   loadAngularCore(); ?>

		<script src="//<?=$intranetPath?>/assets/custom/angular-ui-router/angular-ui-router.min.js" type="text/javascript"></script>

		<script src="//<?=$intranetPath?>/assets/global/plugins/angularjs/plugins/restangular.min.js" type="text/javascript"></script>

		<script type='text/javascript' src='//<?=$intranetPath?>/assets/global/plugins/angular-loading-bar-0.9.0/angular-loading-bar-0.9.0.js'></script>

		<script type='text/javascript' src='//<?php echo $intranetPath; ?>/app/common/common.constants.js'></script>
		<script src="/assets/angular-ui-notification.min.js"></script>
		<script src="/assets/angular-ocModal.js"></script>

		<script src='//intranet.lagtinget.ax/app/rest/rest.module.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/rest/rest.config.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/rest/rest.service.js' type='text/javascript'></script>

		<script src='//intranet.lagtinget.ax/app/login/login.module.js' type='text/javascript'></script>
		<script src='//intranet.lagtinget.ax/app/login/login.service.js' type='text/javascript'></script>

		<script src='/generic/generic.module.js' type='text/javascript'></script>
		<script src='/generic/generic.constants.js' type='text/javascript'></script>
		<script src='/generic/generic.config.js' type='text/javascript'></script>
<!--	<script src='x/generic/generic.run.js' type='text/javascript'></script>
		<script src='x/generic/generic.service.js' type='text/javascript'></script>
-->
		<script src='/generic/generic.filter.js' type='text/javascript'></script>
		<script src='/generic/ws/ws.module.js' type='text/javascript'></script>
		<script src='/generic/ws/ws.service.js' type='text/javascript'></script>

		<script src='/view/view.module.js' type='text/javascript'></script>
		<script src='/view/view.controller.js' type='text/javascript'></script>
		<script src='/view/view.run.js' type='text/javascript'></script>
		<script src='/view/view.service.js' type='text/javascript'></script>
		<script src='/view/topnav.controller.js' type='text/javascript'></script>

<!--
		<script src='/generic/generic.module.js' type='text/javascript'></script>
		<script src='/generic/generic.constants.js' type='text/javascript'></script>
		<script src='/generic/generic.config.js' type='text/javascript'></script>
		<script src='/generic/generic.run.js' type='text/javascript'></script>
		<script src='/generic/generic.service.js' type='text/javascript'></script>
		<script src='/generic/generic.filter.js' type='text/javascript'></script>

		<script src='/client/client.generic/client.generic.module.js' type='text/javascript'></script>
		<script src='/client/client.generic/client.generic.run.js' type='text/javascript'></script>
		<script src='/client/client.generic/client.generic.service.js' type='text/javascript'></script>

		<script src='/generic/ws/ws.module.js' type='text/javascript'></script>
		<script src='/generic/ws/ws.service.js' type='text/javascript'></script>

		<script src='/client/client.main/main.module.js' type='text/javascript'></script>
		<script src='/client/client.main/main.controller.js' type='text/javascript'></script>

		<script src='/client/client.topnav/topnav.module.js' type='text/javascript'></script>
		<script src='/client/client.topnav/topnav.controller.js' type='text/javascript'></script>
-->

		<script type="text/javascript">
			angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + window.location.pathname + '" />'));
		</script>

		<!--<script src="/client/client.js" type="text/javascript"></script>
		-->

	</body>
</html>
